import { Response } from "express";
import AdvisorModel from "../models/Advisor";
import { AdvisorRequest } from "../middleware/advisorAuthMiddleware";
import * as advisorService from "../services/advisorService";

// =====================================================
// GET MY CONVERSATIONS  (dashboard queue)
// =====================================================
export const getMyConversations = async (
  req: AdvisorRequest,
  res: Response
): Promise<void> => {
  const advisor_id = req.advisor?.advisor_id;

  if (!advisor_id) {
    res.status(401).json({ message: "Advisor authentication required." });
    return;
  }

  const conversations = await advisorService.getConversationsForAdvisor(advisor_id);
  res.status(200).json({ conversations });
};

// =====================================================
// GET MY PROFILE
// =====================================================
export const getMyProfile = async (
  req: AdvisorRequest,
  res: Response
): Promise<void> => {
  const advisor_id = req.advisor?.advisor_id;

  if (!advisor_id) {
    res.status(401).json({ message: "Advisor authentication required." });
    return;
  }

  const advisor = await AdvisorModel.findOne({ advisor_id });

  if (!advisor) {
    res.status(404).json({ message: "Advisor account not found." });
    return;
  }

  res.status(200).json({
    advisor: {
      advisor_id: advisor.advisor_id,
      name: advisor.name,
      email: advisor.email,
      gender: advisor.gender,
      type: advisor.type,
      phone_number: advisor.phone_number,
      location: advisor.location,
      working_hours: advisor.working_hours,
      active: advisor.active,
      mustChangePassword: advisor.mustChangePassword,
    },
  });
};

// =====================================================
// UPDATE MY PROFILE
// Deliberately narrow: an advisor can update their own contact
// details and working hours, but NOT their type, email, active
// status, or advisor_id — those stay admin-controlled.
// =====================================================
export const updateMyProfile = async (
  req: AdvisorRequest,
  res: Response
): Promise<void> => {
  const advisor_id = req.advisor?.advisor_id;

  if (!advisor_id) {
    res.status(401).json({ message: "Advisor authentication required." });
    return;
  }

  const { name, phone_number, location, working_hours } = req.body;

  const advisor = await AdvisorModel.findOne({ advisor_id });

  if (!advisor) {
    res.status(404).json({ message: "Advisor account not found." });
    return;
  }

  if (typeof name === "string" && name.trim()) {
    advisor.name = name.trim();
  }

  if (typeof phone_number === "string") {
    advisor.phone_number = phone_number.trim();
  }

  if (typeof location === "string") {
    advisor.location = location.trim();
  }

  if (
    working_hours &&
    typeof working_hours === "object" &&
    working_hours.start &&
    working_hours.end
  ) {
    advisor.working_hours = {
      start: working_hours.start,
      end: working_hours.end,
    };
  }

  await advisor.save();

  res.status(200).json({
    message: "Profile updated successfully.",
    advisor: {
      advisor_id: advisor.advisor_id,
      name: advisor.name,
      email: advisor.email,
      gender: advisor.gender,
      type: advisor.type,
      phone_number: advisor.phone_number,
      location: advisor.location,
      working_hours: advisor.working_hours,
      active: advisor.active,
      mustChangePassword: advisor.mustChangePassword,
    },
  });
};