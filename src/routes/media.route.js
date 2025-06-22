import express from 'express';
import {
    getFavorites,
    getGenres,
    getMedia,
    getPlaybackPosition,
    getPoster,
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
 * tags:
 *   - name: Media
 *     description: Media management and streaming endpoints
 */

/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: Get a list of all media items with optional pagination and genre filtering
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre (e.g. Action, Drama)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of media items and pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 media:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of items
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *                     currentPage:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Items per page
 *                     hasNextPage:
 *                       type: boolean
 *                       description: Indicates if there is a next page
 *                     hasPrevPage:
 *                       type: boolean
 *                       description: Indicates if there is a previous page
 */
router.get('/', getMedia);

/**
 * @swagger
 * /api/media/scan:
 *   post:
 *     summary: Scan the media directories and fetch metadata for all media files
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: Scan completed successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.post('/scan', scanMedia);

/**
 * @swagger
 * /api/media/genres:
 *   get:
 *     summary: Get a list of all available genres
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: List of genres
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
 *     summary: Stream a media file by its ID
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media item ID
 *     responses:
 *       206:
 *         description: Partial content (streaming)
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
 *     summary: Search for media by title, description, or filename
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query string
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 movies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 *                 series:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       overview:
 *                         type: string
 *                       poster:
 *                         type: string
 *                       year:
 *                         type: string
 *                       genre:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       mediaType:
 *                         type: string
 *                       episodes:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Media'
 */
router.get('/search', searchMedia);

/**
 * @swagger
 * /api/media/{id}/favorite:
 *   patch:
 *     summary: Toggle the favorite status for a media item
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media item ID
 *     responses:
 *       200:
 *         description: Favorite status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.patch('/:id/favorite', toggleFavorite);

/**
 * @swagger
 * /api/media/{id}/watch:
 *   patch:
 *     summary: Toggle the watched status for a media item
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media item ID
 *     responses:
 *       200:
 *         description: Watched status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.patch('/:id/watch', toggleWatched);

/**
 * @swagger
 * /api/media/favorites:
 *   get:
 *     summary: Get all favorite media items
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: List of favorite media
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Media'
 */
router.get('/favorites', getFavorites);

/**
 * @swagger
 * /api/media/watched:
 *   get:
 *     summary: Get all watched media items
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: List of watched media
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Media'
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
 *         description: Media item ID
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.put('/:id/position', updatePlaybackPosition);

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
 *         description: Media item ID
 *     responses:
 *       200:
 *         description: Current playback position
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 playback_position:
 *                   type: number
 *                   description: Playback position in seconds
 *                 last_played:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Media or position not found
 */
router.get('/:id/position', getPlaybackPosition);

/**
 * @swagger
 * /api/media/{id}/poster:
 *   get:
 *     summary: Get the poster image for a media item
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media item ID
 *     responses:
 *       200:
 *         description: Poster image returned
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Poster not found
 */
router.get('/:id/poster', getPoster);

/**
 * @swagger
 * /api/media/stats:
 *   get:
 *     summary: Get statistics about the media catalog
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: Media statistics
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

/**
 * @swagger
 * /api/media/health:
 *   get:
 *     summary: Health check endpoint for the API
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 uptime:
 *                   type: number
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
    });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Media:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         filename:
 *           type: string
 *         filepath:
 *           type: string
 *         filesize:
 *           type: integer
 *         title:
 *           type: string
 *         mediaType:
 *           type: string
 *         description:
 *           type: string
 *         poster:
 *           type: string
 *         year:
 *           type: string
 *         genre:
 *           type: string
 *         language:
 *           type: string
 *         rating:
 *           type: number
 *         watched:
 *           type: integer
 *         favorite:
 *           type: integer
 *         playback_position:
 *           type: number
 *         last_played:
 *           type: string
 *           format: date-time
 */

export default router;
