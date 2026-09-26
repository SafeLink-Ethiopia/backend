import { Response } from "express";
import { AwarenessPost } from "../models/AwarenessPost";
import { AdminRequest } from "../middleware/adminAuthMiddleware";

export const createAwarenessPost = async (
  req: AdminRequest,
  res: Response,
): Promise<void> => {
  try {
    const { language, title, content } = req.body;

    if (!language || !["en", "am", "om"].includes(language)) {
      res.status(400).json({
        message: "Language is required and must be en, am, or om.",
      });
      return;
    }

    if (!title || typeof title !== "string") {
      res.status(400).json({
        message: "Title is required.",
      });
      return;
    }

    if (!content || typeof content !== "string") {
      res.status(400).json({
        message: "Content is required.",
      });
      return;
    }

    const post = await AwarenessPost.create({
      language,
      title: title.trim(),
      content: content.trim(),
    });

    res.status(201).json({
      message: "Awareness post created successfully.",
      post,
    });
  } catch (error) {
    console.error("Create awareness post error:", error);

    res.status(500).json({
      message: "Failed to create awareness post.",
    });
  }
};

export const getAwarenessPosts = async (
  req: AdminRequest,
  res: Response,
): Promise<void> => {
  try {
    const posts = await AwarenessPost.find().sort({
      created_at: -1,
    });

    res.status(200).json({
      posts,
    });
  } catch (error) {
    console.error("Get awareness posts error:", error);

    res.status(500).json({
      message: "Failed to fetch awareness posts.",
    });
  }
};

export const updateAwarenessPost = async (
  req: AdminRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { language, title, content } = req.body;

    if (!language || !["en", "am", "om"].includes(language)) {
      res.status(400).json({
        message: "Language is required and must be en, am, or om.",
      });
      return;
    }

    if (!title || typeof title !== "string") {
      res.status(400).json({
        message: "Title is required.",
      });
      return;
    }

    if (!content || typeof content !== "string") {
      res.status(400).json({
        message: "Content is required.",
      });
      return;
    }

    const post = await AwarenessPost.findByIdAndUpdate(
      id,
      {
        language,
        title: title.trim(),
        content: content.trim(),
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!post) {
      res.status(404).json({
        message: "Awareness post not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Awareness post updated successfully.",
      post,
    });
  } catch (error) {
    console.error("Update awareness post error:", error);

    res.status(500).json({
      message: "Failed to update awareness post.",
    });
  }
};

export const deleteAwarenessPost = async (
  req: AdminRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await AwarenessPost.findByIdAndDelete(id);

    if (!post) {
      res.status(404).json({
        message: "Awareness post not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Awareness post deleted successfully.",
    });
  } catch (error) {
    console.error("Delete awareness post error:", error);

    res.status(500).json({
      message: "Failed to delete awareness post.",
    });
  }
};
