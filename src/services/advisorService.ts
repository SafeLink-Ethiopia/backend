import { randomUUID } from "crypto";
import Advisor, { AdvisorType, IAdvisor } from "../models/Advisor";
import Conversation, { IConversation } from "../models/Conversation";

// Medical requests stay on /api/medical, so they are not accepted here.
const SUPPORTED_TYPES: AdvisorType[] = ["general", "legal", "psychological"];
const ALL_TYPES: AdvisorType[] = [
  "medical",
  "legal",
  "psychological",
  "general",
];

// Working hours are "HH:MM" in the service area's local time, not the server's.
const TIME_ZONE = "Africa/Addis_Ababa";
const MAX_TEXT = 2000;

const GREETINGS: Record<AdvisorType, string> = {
  general: "Hi, could you tell me what's happening?",
  medical:
    "Hello. I'm a medical support advisor. You only need to share what you're comfortable sharing. Can you tell me a little about what's going on, or what kind of help you're looking for?",
  legal:
    "Hello. I'm a legal support advisor. You only need to share what you're comfortable sharing. What would you like to know or get help with?",
  psychological:
    "Hello. I'm a support advisor here to listen. You only need to share what you're comfortable sharing. How are you feeling, and what would help right now?",
};

// `{ $ne: true }` instead of `false`, so older documents that don't have the
// field at all are still matched.
const notTrue = { $ne: true };

export function isSupportedType(type: string): type is AdvisorType {
  return SUPPORTED_TYPES.includes(type as AdvisorType);
}

// ---------------------------------------------------------------------------
// Advisor routing
// ---------------------------------------------------------------------------

function currentHHMM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date()); // "14:05"
}

// Zero-padded "HH:MM" strings compare correctly as strings.
// Handles overnight windows (e.g. 22:00 -> 06:00).
function isWithinWorkingHours(
  start: string,
  end: string,
  now = currentHHMM(),
): boolean {
  if (start <= end) return now >= start && now <= end;
  return now >= start || now <= end;
}

// A conversation is "open" for load-balancing until EITHER side hides it.
async function openLoads(advisorIds: string[]): Promise<Map<string, number>> {
  const rows = await Conversation.aggregate([
    {
      $match: {
        advisor_id: { $in: advisorIds },
        hidden_for_user: notTrue,
        hidden_for_advisor: notTrue,
      },
    },
    { $group: { _id: "$advisor_id", open: { $sum: 1 } } },
  ]);
  return new Map<string, number>(
    rows.map((r: any) => [r._id as string, r.open as number]),
  );
}

/**
 * 1. active advisors of this type
 * 2. prefer those currently within working hours
 * 3. fewest open conversations wins
 * 4. fallback: nobody within hours -> least-busy active advisor
 */
export async function pickAdvisor(type: AdvisorType): Promise<IAdvisor | null> {
  const activeAdvisors = await Advisor.find({ type, active: true });
  if (activeAdvisors.length === 0) return null;

  const now = currentHHMM();
  const inHours = activeAdvisors.filter((a) =>
    isWithinWorkingHours(
      a.working_hours?.start ?? "00:00",
      a.working_hours?.end ?? "23:59",
      now,
    ),
  );

  const candidates = inHours.length > 0 ? inHours : activeAdvisors;
  const load = await openLoads(candidates.map((a) => a.advisor_id));

  candidates.sort(
    (a, b) => (load.get(a.advisor_id) ?? 0) - (load.get(b.advisor_id) ?? 0),
  );
  return candidates[0];
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export async function createConversationRequest(
  sessionId: string,
  advisorType: AdvisorType,
): Promise<IConversation> {
  const advisor = await pickAdvisor(advisorType);

  if (!advisor) {
    throw new Error("No advisor is currently available for this type.");
  }

  // The advisor's greeting is already in the thread when the user lands in it.
  return Conversation.create({
    conversation_id: randomUUID(),
    session_id: sessionId,
    advisor_id: advisor.advisor_id,
    advisor_type: advisorType,
    messages: [
      {
        message_id: randomUUID(),
        sender: "advisor",
        text: GREETINGS[advisorType],
        timestamp: new Date(),
        edited: false,
      },
    ],
  });
}

export function getConversationById(id: string) {
  return Conversation.findOne({ conversation_id: id });
}

// Sorting on "messages.timestamp" in Mongo pushes empty threads (new or
// cleared) to the bottom, so sort by last activity here instead.
function lastActivity(c: any): number {
  const msgs = c.messages ?? [];
  const last = msgs[msgs.length - 1];
  return new Date(last?.timestamp ?? c.created_at ?? 0).getTime();
}

export async function getConversationsForSession(sessionId: string) {
  const convos = await Conversation.find({
    session_id: sessionId,
    hidden_for_user: notTrue,
  }).lean();

  return convos.sort((a: any, b: any) => lastActivity(b) - lastActivity(a));
}

export async function getConversationsForAdvisor(advisorId: string) {
  const convos = await Conversation.find({
    advisor_id: advisorId,
    hidden_for_advisor: notTrue,
  }).lean();

  return convos.sort(
    (a: any, b: any) =>
      Number(!!b.urgent) - Number(!!a.urgent) ||
      lastActivity(b) - lastActivity(a),
  );
}

// Advisor "closes"/hides a thread from their own list (frees their load).
export async function closeForAdvisor(
  conversationId: string,
  advisorId: string,
): Promise<boolean> {
  const r = await Conversation.updateOne(
    { conversation_id: conversationId, advisor_id: advisorId },
    { $set: { hidden_for_advisor: true } },
  );
  return r.matchedCount > 0;
}

const cleanText = (v: unknown): string =>
  typeof v === "string" ? v.trim().slice(0, MAX_TEXT) : "";

export async function addMessage(
  conversationId: string,
  sender: "user" | "advisor",
  text: string,
  urgent?: boolean,
): Promise<IConversation | null> {
  const clean = cleanText(text);
  if (!clean || (sender !== "user" && sender !== "advisor")) return null;

  const $set: Record<string, unknown> = {};
  if (sender === "user") {
    $set.hidden_for_advisor = false; // a new user message resurfaces the thread
    if (urgent === true) $set.urgent = true; // users can raise it, not lower it
  } else if (typeof urgent === "boolean") {
    $set.urgent = urgent; // advisors triage: they can clear the flag
  }

  const update: Record<string, unknown> = {
    $push: {
      messages: {
        message_id: randomUUID(),
        sender,
        text: clean,
        timestamp: new Date(),
        edited: false,
        deleted: false,
      },
    },
  };
  if (Object.keys($set).length > 0) update.$set = $set;

  // Atomic push: no read-modify-save, so simultaneous messages can't clobber each other.
  return Conversation.findOneAndUpdate(
    { conversation_id: conversationId },
    update,
    {
      new: true,
    },
  );
}

// `role` is who is editing: you can only edit your own messages.
export async function editMessage(
  conversationId: string,
  index: number,
  text: string,
  role: "user" | "advisor" = "user",
): Promise<IConversation | null> {
  const clean = cleanText(text);
  if (!clean || !Number.isInteger(index) || index < 0) return null;

  const convo: any = await Conversation.findOne({
    conversation_id: conversationId,
  })
    .select("messages")
    .lean();
  const msg = convo?.messages?.[index];
  if (!msg || msg.sender !== role || msg.deleted) return null;

  return Conversation.findOneAndUpdate(
    {
      conversation_id: conversationId,
      [`messages.${index}.sender`]: role, // still the same message if the array changed meanwhile
    },
    {
      $set: {
        [`messages.${index}.text`]: clean,
        [`messages.${index}.edited`]: true,
      },
    },
    { new: true },
  );
}

// Empties the thread but keeps it. NOTE: `recommendation` is left in place.
export async function clearConversation(
  conversationId: string,
): Promise<IConversation | null> {
  return Conversation.findOneAndUpdate(
    { conversation_id: conversationId },
    { $set: { messages: [], suggested_advisor_types: [] } },
    { new: true },
  );
}

export async function softDeleteConversation(
  conversationId: string,
): Promise<boolean> {
  const r = await Conversation.updateOne(
    { conversation_id: conversationId },
    { $set: { hidden_for_user: true } },
  );
  return r.matchedCount > 0;
}

// Only General Advisor conversations carry suggestions, and "general" itself
// is never suggested. Unknown values are dropped.
export async function suggestAdvisorTypes(
  conversationId: string,
  types: AdvisorType[],
): Promise<IConversation | null> {
  const valid = Array.from(
    new Set(types.filter((t) => ALL_TYPES.includes(t))),
  ).filter((t) => t !== "general");

  return Conversation.findOneAndUpdate(
    { conversation_id: conversationId, advisor_type: "general" },
    { $set: { suggested_advisor_types: valid } },
    { new: true },
  );
}
