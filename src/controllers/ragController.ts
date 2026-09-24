import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";

import RagDocument from "../models/RagDocument";
import RagChunk from "../models/RagChunk";

import { extractTextFromFile } from "../services/documentParser";
import { createChunks } from "../services/chunkingService";
import { generateEmbeddings } from "../services/embeddingService";

// ============================================================
// UPLOAD RAG DOCUMENT
// ============================================================

export async function uploadRagDocument(req: Request, res: Response) {
  try {
    // --------------------------------------------------------
    // 1. Check uploaded file
    // --------------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF or DOCX file.",
      });
    }

    // --------------------------------------------------------
    // 2. Get form-data fields
    // --------------------------------------------------------

    const { title, language, category } = req.body;

    // --------------------------------------------------------
    // 3. Validate required fields
    // --------------------------------------------------------

    if (!title || !language || !category) {
      return res.status(400).json({
        message: "Title, language, and category are required.",
      });
    }

    // --------------------------------------------------------
    // 4. Validate language
    // --------------------------------------------------------

    if (!["en", "am", "om"].includes(language)) {
      return res.status(400).json({
        message: "Language must be en, am, or om.",
      });
    }

    // --------------------------------------------------------
    // 5. Determine file type
    // --------------------------------------------------------

    const extension = path.extname(req.file.originalname).toLowerCase();

    let fileType: "pdf" | "docx";

    if (extension === ".pdf") {
      fileType = "pdf";
    } else if (extension === ".docx") {
      fileType = "docx";
    } else {
      await fs.unlink(req.file.path).catch(() => {});

      return res.status(400).json({
        message: "Only PDF and DOCX files are allowed.",
      });
    }

    // --------------------------------------------------------
    // 6. Create document record
    // --------------------------------------------------------

    const document = await RagDocument.create({
      title: title.trim(),
      originalFileName: req.file.originalname,
      fileType,
      filePath: req.file.path,
      language,
      category: category.trim(),
      status: "processing",
    });

    try {
      // ------------------------------------------------------
      // 7. Extract text
      // ------------------------------------------------------

      console.log(`Extracting text from: ${req.file.originalname}`);

      const extractedText = await extractTextFromFile(req.file.path, fileType);

      if (!extractedText) {
        throw new Error("No readable text was found in the document.");
      }

      console.log(`Extracted ${extractedText.length} characters.`);

      // ------------------------------------------------------
      // 8. Create chunks
      // ------------------------------------------------------

      const chunks = createChunks(extractedText);

      if (chunks.length === 0) {
        throw new Error("The document could not be divided into chunks.");
      }

      console.log(`Created ${chunks.length} chunks.`);

      // ------------------------------------------------------
      // 9. Generate embeddings
      // ------------------------------------------------------

      console.log(`Generating embeddings for ${chunks.length} chunks...`);

      const embeddings = await generateEmbeddings(chunks);

      console.log(`Generated ${embeddings.length} embeddings.`);

      // ------------------------------------------------------
      // 10. Prepare chunks
      // ------------------------------------------------------

      const chunksWithEmbeddings = chunks.map((content, index) => ({
        documentId: document._id,
        content,
        language,
        chunkIndex: index,
        embedding: embeddings[index],
      }));

      // ------------------------------------------------------
      // 11. Save chunks
      // ------------------------------------------------------

      await RagChunk.insertMany(chunksWithEmbeddings);

      // ------------------------------------------------------
      // 12. Mark document as ready
      // ------------------------------------------------------

      document.status = "ready";
      document.errorMessage = undefined;

      await document.save();

      // ------------------------------------------------------
      // 13. Return success
      // ------------------------------------------------------

      return res.status(201).json({
        message: "Document uploaded, processed, and embedded successfully.",

        document: {
          id: document._id,
          title: document.title,
          originalFileName: document.originalFileName,
          fileType: document.fileType,
          language: document.language,
          category: document.category,
          status: document.status,
          chunks: chunks.length,
        },
      });
    } catch (processingError) {
      // ------------------------------------------------------
      // Processing failed
      // ------------------------------------------------------

      document.status = "failed";

      document.errorMessage =
        processingError instanceof Error
          ? processingError.message
          : "Document processing failed.";

      await document.save();

      console.error("RAG document processing error:", processingError);

      return res.status(500).json({
        message: "Document processing failed.",
        error: document.errorMessage,
      });
    }
  } catch (error) {
    console.error("Upload RAG document error:", error);

    return res.status(500).json({
      message: "Failed to upload document.",
    });
  }
}

// ============================================================
// GET ALL RAG DOCUMENTS
// ============================================================

export async function getRagDocuments(_req: Request, res: Response) {
  try {
    const documents = await RagDocument.find().sort({ createdAt: -1 }).lean();

    const documentsWithChunkCount = await Promise.all(
      documents.map(async (document) => {
        const chunks = await RagChunk.countDocuments({
          documentId: document._id,
        });

        return {
          id: document._id,
          title: document.title,
          originalFileName: document.originalFileName,
          fileType: document.fileType,
          language: document.language,
          category: document.category,
          status: document.status,
          errorMessage: document.errorMessage,
          chunks,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        };
      }),
    );

    return res.status(200).json({
      documents: documentsWithChunkCount,
    });
  } catch (error) {
    console.error("Get RAG documents error:", error);

    return res.status(500).json({
      message: "Failed to fetch RAG documents.",
    });
  }
}

// ============================================================
// GET ONE RAG DOCUMENT
// ============================================================

export async function getRagDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const document = await RagDocument.findById(id).lean();

    if (!document) {
      return res.status(404).json({
        message: "RAG document not found.",
      });
    }

    const chunks = await RagChunk.find({
      documentId: document._id,
    })
      .sort({ chunkIndex: 1 })
      .select("content language chunkIndex")
      .lean();

    return res.status(200).json({
      document: {
        id: document._id,
        title: document.title,
        originalFileName: document.originalFileName,
        fileType: document.fileType,
        language: document.language,
        category: document.category,
        status: document.status,
        errorMessage: document.errorMessage,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        chunks,
      },
    });
  } catch (error) {
    console.error("Get RAG document error:", error);

    return res.status(500).json({
      message: "Failed to fetch RAG document.",
    });
  }
}

// ============================================================
// UPDATE RAG DOCUMENT
// ============================================================

export async function updateRagDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const document = await RagDocument.findById(id);

    if (!document) {
      // If a new file was uploaded but the
      // document doesn't exist, remove that file.
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      return res.status(404).json({
        message: "RAG document not found.",
      });
    }

    const { title, language, category } = req.body;

    // --------------------------------------------------------
    // Validate title
    // --------------------------------------------------------

    if (title !== undefined && !title.trim()) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      return res.status(400).json({
        message: "Title cannot be empty.",
      });
    }

    // --------------------------------------------------------
    // Validate language
    // --------------------------------------------------------

    if (language !== undefined && !["en", "am", "om"].includes(language)) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      return res.status(400).json({
        message: "Language must be en, am, or om.",
      });
    }

    // --------------------------------------------------------
    // Validate category
    // --------------------------------------------------------

    if (category !== undefined && !category.trim()) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      return res.status(400).json({
        message: "Category cannot be empty.",
      });
    }

    // ========================================================
    // CASE 1: Metadata-only update
    // ========================================================

    if (!req.file) {
      if (title !== undefined) {
        document.title = title.trim();
      }

      if (language !== undefined) {
        document.language = language;
      }

      if (category !== undefined) {
        document.category = category.trim();
      }

      await document.save();

      const chunks = await RagChunk.countDocuments({
        documentId: document._id,
      });

      return res.status(200).json({
        message: "RAG document updated successfully.",

        document: {
          id: document._id,
          title: document.title,
          originalFileName: document.originalFileName,
          fileType: document.fileType,
          language: document.language,
          category: document.category,
          status: document.status,
          chunks,
        },
      });
    }

    // ========================================================
    // CASE 2: Replace document file
    // ========================================================

    const extension = path.extname(req.file.originalname).toLowerCase();

    let fileType: "pdf" | "docx";

    if (extension === ".pdf") {
      fileType = "pdf";
    } else if (extension === ".docx") {
      fileType = "docx";
    } else {
      await fs.unlink(req.file.path).catch(() => {});

      return res.status(400).json({
        message: "Only PDF and DOCX files are allowed.",
      });
    }

    // Save old file path before replacing it.
    const oldFilePath = document.filePath;

    // --------------------------------------------------------
    // Delete old chunks
    // --------------------------------------------------------

    await RagChunk.deleteMany({
      documentId: document._id,
    });

    // --------------------------------------------------------
    // Update metadata
    // --------------------------------------------------------

    if (title !== undefined) {
      document.title = title.trim();
    }

    if (language !== undefined) {
      document.language = language;
    }

    if (category !== undefined) {
      document.category = category.trim();
    }

    document.originalFileName = req.file.originalname;

    document.fileType = fileType;
    document.filePath = req.file.path;
    document.status = "processing";
    document.errorMessage = undefined;

    await document.save();

    // --------------------------------------------------------
    // Delete old physical file
    // --------------------------------------------------------

    await fs.unlink(oldFilePath).catch(() => {});

    try {
      // ------------------------------------------------------
      // Extract new file
      // ------------------------------------------------------

      console.log(`Extracting replacement file: ${req.file.originalname}`);

      const extractedText = await extractTextFromFile(req.file.path, fileType);

      if (!extractedText) {
        throw new Error("No readable text was found in the document.");
      }

      console.log(`Extracted ${extractedText.length} characters.`);

      // ------------------------------------------------------
      // Create new chunks
      // ------------------------------------------------------

      const chunks = createChunks(extractedText);

      if (chunks.length === 0) {
        throw new Error("The document could not be divided into chunks.");
      }

      console.log(`Created ${chunks.length} chunks.`);

      // ------------------------------------------------------
      // Generate new embeddings
      // ------------------------------------------------------

      console.log(`Generating embeddings for ${chunks.length} chunks...`);

      const embeddings = await generateEmbeddings(chunks);

      console.log(`Generated ${embeddings.length} embeddings.`);

      // ------------------------------------------------------
      // Prepare new chunks
      // ------------------------------------------------------

      const chunksWithEmbeddings = chunks.map((content, index) => ({
        documentId: document._id,
        content,
        language: document.language,
        chunkIndex: index,
        embedding: embeddings[index],
      }));

      // ------------------------------------------------------
      // Save new chunks
      // ------------------------------------------------------

      await RagChunk.insertMany(chunksWithEmbeddings);

      // ------------------------------------------------------
      // Mark document ready
      // ------------------------------------------------------

      document.status = "ready";
      document.errorMessage = undefined;

      await document.save();

      return res.status(200).json({
        message: "RAG document replaced and processed successfully.",

        document: {
          id: document._id,
          title: document.title,
          originalFileName: document.originalFileName,
          fileType: document.fileType,
          language: document.language,
          category: document.category,
          status: document.status,
          chunks: chunks.length,
        },
      });
    } catch (processingError) {
      document.status = "failed";

      document.errorMessage =
        processingError instanceof Error
          ? processingError.message
          : "Document processing failed.";

      await document.save();

      console.error("Replacement document processing error:", processingError);

      return res.status(500).json({
        message: "Document processing failed.",
        error: document.errorMessage,
      });
    }
  } catch (error) {
    console.error("Update RAG document error:", error);

    return res.status(500).json({
      message: "Failed to update RAG document.",
    });
  }
}

// ============================================================
// DELETE RAG DOCUMENT
// ============================================================

export async function deleteRagDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const document = await RagDocument.findById(id);

    if (!document) {
      return res.status(404).json({
        message: "RAG document not found.",
      });
    }

    // --------------------------------------------------------
    // Delete chunks and embeddings
    // --------------------------------------------------------

    await RagChunk.deleteMany({
      documentId: document._id,
    });

    // --------------------------------------------------------
    // Delete physical file
    // --------------------------------------------------------

    await fs.unlink(document.filePath).catch(() => {});

    // --------------------------------------------------------
    // Delete document
    // --------------------------------------------------------

    await RagDocument.findByIdAndDelete(id);

    return res.status(200).json({
      message: "RAG document deleted successfully.",
    });
  } catch (error) {
    console.error("Delete RAG document error:", error);

    return res.status(500).json({
      message: "Failed to delete RAG document.",
    });
  }
}
export const viewRagDocumentFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await RagDocument.findById(id);

    if (!document) {
      return res.status(404).json({
        message: "RAG document not found.",
      });
    }

    const filePath = path.resolve(document.filePath);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        message: "Original document file not found.",
      });
    }

    if (document.fileType === "pdf") {
      res.setHeader("Content-Type", "application/pdf");

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${document.originalFileName}"`,
      );
    } else {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.originalFileName}"`,
      );
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error("View RAG document file error:", error);

    return res.status(500).json({
      message: "Failed to open the original document.",
    });
  }
};
