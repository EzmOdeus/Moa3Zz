/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         url:
 *           type: string
 *         source:
 *           type: string
 *           enum: [upload, external]
 *         createdAt:
 *           type: string
 *         views:
 *           type: integer
 *         likes:
 *           type: integer
 *
 * /videos:
 *   get:
 *     summary: Get all videos
 *     responses:
 *       200:
 *         description: List of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *   post:
 *     summary: Add a video
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               url:
 *                 type: string
 *               source:
 *                 type: string
 *                 enum: [upload, external]
 *     responses:
 *       201:
 *         description: Created video
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 * 
 */
const express = require('express');
const router = express.Router();
const store = require('./videoStore');

router.get('/videos', (req, res) => {
  const videos = store.getAllVideos();
  res.json(videos );
});

router.get('/videos/last', (req, res) => {
  const video = store.getLastViewed(req.userId) || store.getAllVideos()[0];
  if (!video) return res.status(404).json({ error: 'No videos available' });
  res.json({ data: video });
});

router.get('/videos/:id', (req, res) => {
  const video = store.getVideoById(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  store.setLastViewed(req.userId, video.id);
  res.json(video);
});

/**
 * @swagger
 * /videos/{id}:
 *   get:
 *     summary: Get a single video by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       404:
 *         description: Not found
 * /videos/{id}/views:
 *   post:
 *     summary: Increment view count
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated video
 *       404:
 *         description: Not found
 *
 * /videos/{id}/likes:
 *   post:
 *     summary: Increment like count
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated video
 *       404:
 *         description: Not found
 *
 * /admin/stats:
 *   get:
 *     summary: Get admin stats
 *     responses:
 *       200:
 *         description: Statistics
 */
router.get('/admin/stats', (req, res) => {
  res.json({ data: store.getStats() });
});

/**
 * @swagger
 * /admin/refresh:
 *   post:
 *     summary: Force refresh videos now (admin)
 *     responses:
 *       200:
 *         description: Refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/admin/refresh', (req, res) => {
  store.refreshVideos();
  res.json({ message: 'Videos refreshed successfully' });
});

router.get('/admin/videos', (req, res) => {
  res.json({ data: store.getAllVideos() });
});

router.post('/videos', (req, res) => {
  const { title, url, source } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  const video = store.addVideo({ title, url, source });
  res.status(201).json({ data: video });
});

router.delete('/videos/:id', (req, res) => {
  const deleted = store.deleteVideo(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Video not found' });
  res.sendStatus(204);
});

router.post('/videos/:id/views', (req, res) => {
  const video = store.incrementView(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  store.setLastViewed(req.userId, video.id);
  res.json({ data: video });
});

router.post('/videos/:id/likes', (req, res) => {
  const video = store.incrementLike(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json({ data: video });
});

module.exports = router;
