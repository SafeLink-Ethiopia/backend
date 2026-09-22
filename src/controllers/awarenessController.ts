import { Request, Response } from "express";
import { searchScholarXIV } from "../services/scholarxivService";

type AwarenessTopic = "consent" | "boundaries" | "harassment" | "support";

const topicKeywords: Record<AwarenessTopic, string[]> = {
  consent: [
    "consent",
    "sexual consent",
    "informed consent",
    "consensual",
    "sexual violence",
    "sexual assault",
  ],

  boundaries: [
    "personal boundaries",
    "interpersonal boundaries",
    "relationship boundaries",
    "physical boundaries",
    "emotional boundaries",
    "personal space",
    "body boundaries",
    "privacy boundaries",
  ],

  harassment: [
    "sexual harassment",
    "harassment",
    "sexual abuse",
    "sexual violence",
    "unwanted sexual",
    "online harassment",
    "workplace harassment",
  ],

  support: [
    "sexual violence",
    "sexual assault",
    "survivor",
    "survivors",
    "help seeking",
    "help-seeking",
    "support seeking",
    "support-seeking",
    "victim support",
    "survivor services",
    "mental health support",
    "counseling",
    "counselling",
    "social support",
  ],
};

async function getResearchSources(query: string, topic: AwarenessTopic) {
  const results = await searchScholarXIV(query);

  const papers = results.data ?? [];

  const keywords = topicKeywords[topic];

  const filteredPapers = papers.filter((paper: any) => {
    const title = (paper.title ?? "").toLowerCase();
    const summary = (paper.summary ?? "").toLowerCase();

    const text = `${title} ${summary}`;

    return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  });

  return filteredPapers.slice(0, 3).map((paper: any) => ({
    title: paper.title,
    summary: paper.summary,
    authors: paper.authors,
    published: paper.published,
    pdfLink: paper.pdfLink,
    absLink: paper.absLink,
  }));
}

export async function getConsentAwareness(req: Request, res: Response) {
  try {
    const sources = await getResearchSources("sexual consent", "consent");

    res.json({
      slug: "consent",
      title: "What is Consent?",
      description:
        "Learn about consent, personal boundaries, and respectful interactions.",
      sources,
    });
  } catch (error) {
    console.error("Consent awareness error:", error);

    res.status(500).json({
      message: "Unable to load consent awareness information.",
    });
  }
}

export async function getBoundariesAwareness(req: Request, res: Response) {
  try {
    const sources = await getResearchSources(
      "personal boundaries",
      "boundaries",
    );

    res.json({
      slug: "boundaries",
      title: "Personal Boundaries",
      description:
        "Learn about setting, communicating, and respecting personal boundaries.",
      sources,
    });
  } catch (error) {
    console.error("Boundaries awareness error:", error);

    res.status(500).json({
      message: "Unable to load boundaries awareness information.",
    });
  }
}

export async function getHarassmentAwareness(req: Request, res: Response) {
  try {
    const sources = await getResearchSources("sexual harassment", "harassment");

    res.json({
      slug: "harassment",
      title: "Understanding Harassment",
      description:
        "Learn how to recognize unwanted or inappropriate behavior and understand when to seek support.",
      sources,
    });
  } catch (error) {
    console.error("Harassment awareness error:", error);

    res.status(500).json({
      message: "Unable to load harassment awareness information.",
    });
  }
}

export async function getSupportAwareness(req: Request, res: Response) {
  try {
    const sources = await getResearchSources(
      "support sexual violence survivors",
      "support",
    );

    res.json({
      slug: "support",
      title: "Getting Support",
      description:
        "Learn about seeking support and finding trusted resources when you need help.",
      sources,
    });
  } catch (error) {
    console.error("Support awareness error:", error);

    res.status(500).json({
      message: "Unable to load support awareness information.",
    });
  }
}
