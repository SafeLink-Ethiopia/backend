import { Request, Response } from "express";
import * as advisorService from "../services/advisorService";

export async function requestAdvisor(req: Request, res: Response) {
  try {
    const { session_id, advisor_type } = req.body;

    if (!session_id || !advisorService.isSupportedType(advisor_type)) {
      return res.status(400).json({ error: "Invalid session_id or advisor_type." });
    }

    const conversation = await advisorService.createConversationRequest(
      session_id,
      advisor_type
    );

    res.json(conversation);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to start a conversation.";
    res.status(503).json({ error: message });
  }
}

export async function getConversation(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const conversation = await advisorService.getConversationById(id);

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }

  res.json(conversation);
}

export async function getConversations(req: Request, res: Response) {
  const { session_id } = req.query;

  if (!session_id || typeof session_id !== "string") {
    return res.status(400).json({ error: "session_id is required." });
  }

  const conversations = await advisorService.getConversationsForSession(session_id);
  res.json(conversations);
}

export async function postMessage(req: Request, res: Response) {
  const { sender, text, urgent } = req.body;

  if (!sender || !text) {
    return res.status(400).json({ error: "sender and text are required." });
  }

  const conversation = await advisorService.addMessage(
    Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    sender,
    text,
    urgent
  );

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }

  res.json(conversation);
}

export async function patchMessage(req: Request, res: Response) {
  const { text } = req.body;
  const index = Number(req.params.index);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const conversation = await advisorService.editMessage(id, index, text);

  if (!conversation) {
    return res.status(404).json({ error: "Conversation or message not found." });
  }

  res.json(conversation);
}

export async function postClear(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const conversation = await advisorService.clearConversation(id);

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }

  res.json(conversation);
}

export async function deleteConversation(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = await advisorService.softDeleteConversation(id);

  if (!success) {
    return res.status(404).json({ error: "Conversation not found." });
  }

  res.json({ status: "deleted" });
}

export async function postSuggest(req: Request, res: Response) {
  const { types } = req.body;

  if (!Array.isArray(types)) {
    return res.status(400).json({ error: "types must be an array." });
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const conversation = await advisorService.suggestAdvisorTypes(id, types);

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }

  res.json(conversation);
}
