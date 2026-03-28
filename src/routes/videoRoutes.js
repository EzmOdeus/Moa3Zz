const express = require("express");
const VideoController = require("../controllers/videoController");
const router = express.Router();

// Routes
router.get("/videos", VideoController.getAllVideos);
router.get("/videos/:id", VideoController.getVideoById);
router.post("/videos", VideoController.createVideo);
router.put("/videos/:id", VideoController.updateVideo);
router.delete("/videos/:id", VideoController.deleteVideo);
router.delete("/videos/:id/permanent", VideoController.hardDeleteVideo);

// Interaction routes
router.patch("/videos/:id/view", VideoController.incrementViews);
router.patch("/videos/:id/like", VideoController.incrementLikes);

// Stats routes
router.get("/stats", VideoController.getStats);

// User last viewed routes
router.post("/user/last-viewed", VideoController.setLastViewed);
router.get("/user/:userId/last-viewed", VideoController.getLastViewed);

module.exports = router;
