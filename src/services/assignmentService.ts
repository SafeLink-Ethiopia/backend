import Advisor from "../models/Advisor";
import Conversation from "../models/Conversation";

export async function findEligibleAdvisor(
  advisorType: "medical" | "legal" | "psychological" | "general"
): Promise<string | null> {
  // 1. Find active advisors matching the required type
  const activeAdvisors = await Advisor.find({ type: advisorType, active: true });
  if (activeAdvisors.length === 0) return null;

  const now = new Date();
  const currentHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 2. Filter advisors currently inside working_hours
  const workingAdvisors = activeAdvisors.filter((adv) => {
    const { start, end } = adv.working_hours;
    return currentHM >= start && currentHM <= end;
  });

  const pool = workingAdvisors.length > 0 ? workingAdvisors : activeAdvisors;

  // 3. Select the candidate with the fewest open conversations
  let selectedAdvisorId: string | null = null;
  let lowestCount = Infinity;

  for (const adv of pool) {
    const openCount = await Conversation.countDocuments({
      advisor_id: adv.advisor_id,
      hidden_for_user: false,
      hidden_for_advisor: false,
    });

    if (openCount < lowestCount) {
      lowestCount = openCount;
      selectedAdvisorId = adv.advisor_id;
    }
  }

  return selectedAdvisorId;
}