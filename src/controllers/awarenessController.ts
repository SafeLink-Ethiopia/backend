import { Request, Response } from "express";
import { searchScholarXIV } from "../services/scholarxivService";

export async function getConsentAwareness(req: Request, res: Response) {
  try {
    const results = await searchScholarXIV("sexual assault");

    const papers = results.data ?? [];

    const filteredPapers = papers.filter((paper: any) => {
      const title = (paper.title ?? "").toLowerCase();
      const summary = (paper.summary ?? "").toLowerCase();

      const text = `${title} ${summary}`;

      const sexualContext = [
        "sexual consent",
        "sexual assault",
        "sexual violence",
        "sexual abuse",
        "sexual harassment",
        "sexual coercion",
        "rape",
        "intimate partner violence",
        "sexual misconduct",
      ];

      return sexualContext.some((keyword) => text.includes(keyword));
    });

    const sources = filteredPapers.slice(0, 3).map((paper: any) => ({
      title: paper.title,
      summary: paper.summary,
      authors: paper.authors,
      published: paper.published,
      pdfLink: paper.pdfLink,
      absLink: paper.absLink,
    }));

    res.json({
      slug: "consent",
      title: "What is Consent?",
      description:
        "Learn about consent, personal boundaries, and respectful interactions.",
      sources,
    });
  } catch (error) {
    console.error("Awareness error:", error);

    res.status(500).json({
      message: "Unable to load awareness information.",
    });
  }
}
