import express from 'express';
import {
    getFavorites,
    getGenres,
    getMedia,
    getPlaybackPosition,
    getStats,
    getWatched,
    scanMedia,
    searchMedia,
    streamMedia,
    toggleFavorite,
    toggleWatched,
    updatePlaybackPosition,
} from '../controllers/media.controller.js';

const router = express.Router();

/**
 * @swagger
 * openapi: 3.0.0
 * info:
 *   title: Raspi Media API
 *   version: 1.0.0
 *   description: API for managing and streaming media files
 * servers:
 *   - url: http://localhost:3000
 */

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media management and streaming
 */

/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: List all media (optionally filtered by genre)
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Genre filter (e.g. Action, Drama)
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', getMedia);

/**
 * @swagger
 * /api/media/scan:
 *   post:
 *     summary: Scan the media directory and fetch metadata
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: Scan completed
 */
router.post('/scan', scanMedia);

/**
 * @swagger
 * /api/media/genres:
 *   get:
 *     summary: List all available genres
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/genres', getGenres);

/**
 * @swagger
 * /api/media/stream/{id}:
 *   get:
 *     summary: Stream a media file by ID
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media ID
 *     responses:
 *       206:
 *         description: Partial Content (streaming)
 *       200:
 *         description: Success
 *       404:
 *         description: Media not found
 */
router.get('/stream/:id', streamMedia);

/**
 * @swagger
 * /api/media/search:
 *   get:
 *     summary: Search media by title, description, or filename
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/search', searchMedia);

/**
 * @swagger
 * /api/media/{id}/favorite:
 *   patch:
 *     summary: Toggle favorite status for a media item
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Favorite toggled
 */
router.patch('/:id/favorite', toggleFavorite);

/**
 * @swagger
 * /api/media/{id}/watch:
 *   patch:
 *     summary: Toggle watched status for a media item
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Watched toggled
 */
router.patch('/:id/watch', toggleWatched);

/**
 * @swagger
 * /api/media/favorites:
 *   get:
 *     summary: List all favorite media
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/favorites', getFavorites);

/**
 * @swagger
 * /api/media/watched:
 *   get:
 *     summary: List all watched media
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/watched', getWatched);

/**
 * @swagger
 * /api/media/{id}/position:
 *   put:
 *     summary: Set the playback position for a media item
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               position:
 *                 type: number
 *                 description: New playback position in seconds
 *     responses:
 *       200:
 *         description: Playback position updated
 */
router.put('/media/:id/position', updatePlaybackPosition);

/**
 * @swagger
 * /api/media/{id}/position:
 *   get:
 *     summary: Get the current playback position for a media item
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Current playback position
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 position:
 *                   type: number
 *                   description: Playback position in seconds
 *       404:
 *         description: Media or position not found
 */
router.get('/media/:id/position', getPlaybackPosition);

/**
 * @swagger
 * /api/media/stats:
 *   get:
 *     summary: Get media statistics
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 watched:
 *                   type: integer
 *                 favorites:
 *                   type: integer
 *                 totalSizeGB:
 *                   type: number
 */
router.get('/stats', getStats);

export default router;
