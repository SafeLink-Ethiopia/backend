import { randomUUID } from "crypto";
import Advisor, { AdvisorType, IAdvisor } from "../models/Advisor";
import Conversation, { IConversation } from "../models/Conversation";

const SUPPORTED_TYPES: AdvisorType[] = ["general", "legal", "psychological"];

export function isSupportedType(type: string): type is AdvisorType {
  return SUPPORTED_TYPES.includes(type as AdvisorType);
}

function isWithinWorkingHours(start: string, end: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

async function countOpenConversations(advisorId: string): Promise<number> {
  return Conversation.countDocuments({
    advisor_id: advisorId,
    hidden_for_user: false,
  });
}

/**
 * Picks the best available advisor of a given type:
 * 1. Must be active.
 * 2. Prefer advisors currently within their working hours.
 * 3. Among candidates, pick whichever has the fewest open conversations.
 * 4. Fallback: if nobody is within working hours, use the least-busy
 *    active advisor regardless of hours, so a user is never stuck.
 */
export async function pickAdvisor(type: AdvisorType): Promise<IAdvisor | null> {
  const activeAdvisors = await Advisor.find({ type, active: true });

  if (activeAdvisors.length === 0) return null;

  const withinHours = activeAdvisors.filter((advisor) =>
    isWithinWorkingHours(advisor.working_hours.start, advisor.working_hours.end)
  );

  const candidates = withinHours.length > 0 ? withinHours : activeAdvisors;

  const withLoad = await Promise.all(
    candidates.map(async (advisor) => ({
      advisor,
      load: await countOpenConversations(advisor.advisor_id),
    }))
  );

  withLoad.sort((a, b) => a.load - b.load);

  return withLoad[0].advisor;
}

export async function createConversationRequest(
  sessionId: string,
  advisorType: AdvisorType
): Promise<IConversation> {
  const advisor = await pickAdvisor(advisorType);

  if (!advisor) {
    throw new Error("No advisor is currently available for this type.");
  }

  return Conversation.create({
    conversation_id: randomUUID(),
    session_id: sessionId,
    advisor_id: advisor.advisor_id,
    advisor_type: advisorType,
    messages: [],
  });
}

export function getConversationById(id: string) {
  return Conversation.findOne({ conversation_id: id });
}

export function getConversationsForSession(sessionId: string) {
  return Conversation.find({
    session_id: sessionId,
    hidden_for_user: false,
  }).sort({ "messages.timestamp": -1 });
}

export async function addMessage(
  conversationId: string,
  sender: "user" | "advisor",
  text: string,
  urgent?: boolean
): Promise<IConversation | null> {
  const conversation = await Conversation.findOne({
    conversation_id: conversationId,
  });

  if (!conversation) return null;

  conversation.messages.push({
    sender,
    text,
    timestamp: new Date(),
    edited: false,
  });

  if (typeof urgent === "boolean") {
    conversation.urgent = urgent;
  }

  await conversation.save();
  return conversation;
}

export async function editMessage(
  conversationId: string,
  index: number,
  text: string
): Promise<IConversation | null> {
  const conversation = await Conversation.findOne({
    conversation_id: conversationId,
  });

  if (!conversation || !conversation.messages[index]) return null;

  conversation.messages[index].text = text;
  conversation.messages[index].edited = true;

  await conversation.save();
  return conversation;
}

export async function clearConversation(
  conversationId: string
): Promise<IConversation | null> {
  const conversation = await Conversation.findOne({
    conversation_id: conversationId,
  });

  if (!conversation) return null;

  conversation.messages = [];
  conversation.suggested_advisor_types = [];
  await conversation.save();
  return conversation;
}

export async function softDeleteConversation(
  conversationId: string
): Promise<boolean> {
  const conversation = await Conversation.findOne({
    conversation_id: conversationId,
  });

  if (!conversation) return false;

  conversation.hidden_for_user = true;
  await conversation.save();
  return true;
}

export async function suggestAdvisorTypes(
  conversationId: string,
  types: AdvisorType[]
): Promise<IConversation | null> {
  const conversation = await Conversation.findOne({
    conversation_id: conversationId,
  });

  if (!conversation) return null;

  conversation.suggested_advisor_types = types;
  await conversation.save();
  return conversation;
}
