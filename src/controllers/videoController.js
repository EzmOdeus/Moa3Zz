const Video = require("../models/Video");

// In-memory storage for user last viewed (can be replaced with Redis)
const lastViewedByUser = new Map();

class VideoController {
  // Get all videos
  static async getAllVideos(req, res, next) {
    try {
      const { limit = 50, skip = 0, sort = "-createdAt" } = req.query;

      const videos = await Video.find({ isActive: true })
        .sort(sort)
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await Video.countDocuments({ isActive: true });

      res.json({
        success: true,
        data: videos,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: parseInt(skip) + videos.length < total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get video by ID
  static async getVideoById(req, res, next) {
    try {
      const { id } = req.params;
      const video = await Video.findOne({ id, isActive: true });

      if (!video) {
        return res.status(404).json({
          success: false,
          error: "Video not found",
        });
      }

      res.json({
        success: true,
        data: video,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new video
  static async createVideo(req, res, next) {
    try {
      const { title, url, source } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: "URL is required",
        });
      }

      const video = new Video({
        title: title || "Reel جديد",
        url,
        source: source === "external" ? "external" : "upload",
      });

      const savedVideo = await video.save();

      res.status(201).json({
        success: true,
        data: savedVideo,
        message: "Video created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Update video
  static async updateVideo(req, res, next) {
    try {
      const { id } = req.params;
      const { title, isActive } = req.body;

      const video = await Video.findOne({ id });

      if (!video) {
        return res.status(404).json({
          success: false,
          error: "Video not found",
        });
      }

      if (title) video.title = title;
      if (typeof isActive === "boolean") video.isActive = isActive;

      await video.save();

      res.json({
        success: true,
        data: video,
        message: "Video updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete video (soft delete)
  static async deleteVideo(req, res, next) {
    try {
      const { id } = req.params;

      const video = await Video.findOneAndUpdate(
        { id },
        { isActive: false },
        { new: true }
      );

      if (!video) {
        return res.status(404).json({
          success: false,
          error: "Video not found",
        });
      }

      res.json({
        success: true,
        message: "Video deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Hard delete video (permanent)
  static async hardDeleteVideo(req, res, next) {
    try {
      const { id } = req.params;

      const result = await Video.findOneAndDelete({ id });

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "Video not found",
        });
      }

      res.json({
        success: true,
        message: "Video permanently deleted",
      });
    } catch (error) {
      next(error);
    }
  }

  // Increment views
  static async incrementViews(req, res, next) {
    try {
      const { id } = req.params;

      const video = await Video.findOne({ id, isActive: true });

      if (!video) {
        return res.status(404).json({
          success: false,
          error: "Video not found",
        });
      }

      const updatedVideo = await video.incrementViews();

      res.json({
        success: true,
        data: updatedVideo,
        message: "Views incremented",
      });
    } catch (error) {
      next(error);
    }
  }

  // Increment likes
  static async incrementLikes(req, res, next) {
    try {
      const { id } = req.params;

      const video = await Video.findOne({ id, isActive: true });

      if (!video) {
        return res.status(404).json({
          success: false,
          error: "Video not found",
        });
      }

      const updatedVideo = await video.incrementLikes();

      res.json({
        success: true,
        data: updatedVideo,
        message: "Likes incremented",
      });
    } catch (error) {
      next(error);
    }
  }

  // Get statistics
  static async getStats(req, res, next) {
    try {
      const stats = await Video.getStats();
      const topVideos = await Video.find({ isActive: true })
        .sort("-views")
        .limit(5);

      res.json({
        success: true,
        data: {
          ...stats,
          topVideos,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Set last viewed video for user
  static setLastViewed(req, res, next) {
    try {
      const { userId, videoId } = req.body;

      if (!userId || !videoId) {
        return res.status(400).json({
          success: false,
          error: "User ID and Video ID are required",
        });
      }

      lastViewedByUser.set(userId, videoId);

      res.json({
        success: true,
        message: "Last viewed updated",
      });
    } catch (error) {
      next(error);
    }
  }

  // Get last viewed video for user
  static async getLastViewed(req, res, next) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      const videoId = lastViewedByUser.get(userId);

      if (!videoId) {
        return res.json({
          success: true,
          data: null,
          message: "No recently viewed videos",
        });
      }

      const video = await Video.findOne({ id: videoId, isActive: true });

      res.json({
        success: true,
        data: video,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VideoController;
