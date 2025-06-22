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
 *     description: Media management, series/episode indexing, streaming, and metadata endpoints
 */

/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: Get a paginated list of all series with nested episodes
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter series by genre (e.g. Action, Drama)
 *       - in: query
 *         name: mediaType
 *         schema:
 *           type: string
 *           enum: [series, movie]
 *         description: Filter by media type
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
 *         description: Number of series per page
 *     responses:
 *       200:
 *         description: Paginated list of series with nested episodes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 series:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Series'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             examples:
 *               example:
 *                 value:
 *                   series:
 *                     - id: 1
 *                       title: "The Office"
 *                       overview: "A mockumentary on a group of typical office workers..."
 *                       genre: "Comedy"
 *                       poster: "/data/posters/the_office/poster.jpg"
 *                       backdrop: "/data/backdrops/the_office/backdrop.jpg"
 *                       mediaType: "series"
 *                       episodes:
 *                         - id: 101
 *                           title: "Pilot"
 *                           filepath: "/Serien/The Office/Staffel 1/E01.mp4"
 *                           poster: "/data/posters/the_office/S1E1.jpg"
 *                           year: "2005"
 *                           genre: "Comedy"
 *                           mediaType: "series"
 *                           seriesId: 1
 *                   pagination:
 *                     total: 1
 *                     totalPages: 1
 *                     currentPage: 1
 *                     limit: 20
 *                     hasNextPage: false
 *                     hasPrevPage: false
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getMedia);

/**
 * @swagger
 * /api/media/scan:
 *   post:
 *     summary: Scan the media directories and index all media files and series
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: Scan completed successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       500:
 *         description: Scan failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/genres', getGenres);

/**
 * @swagger
 * /api/media/stream/{id}:
 *   get:
 *     summary: Stream a media file (movie or episode) by its ID
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
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       200:
 *         description: Success (full file)
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Media not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stream/:id', streamMedia);

/**
 * @swagger
 * /api/media/search:
 *   get:
 *     summary: Search for movies and series episodes by title, description, or filename
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query string
 *     responses:
 *       200:
 *         description: Search results for movies and series
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 movies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MediaEntry'
 *                 series:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SeriesSearchResult'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', searchMedia);

/**
 * @swagger
 * /api/media/{id}/favorite:
 *   patch:
 *     summary: Toggle the favorite status for a media item (movie or episode)
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
 *       404:
 *         description: Media not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/favorite', toggleFavorite);

/**
 * @swagger
 * /api/media/{id}/watch:
 *   patch:
 *     summary: Toggle the watched status for a media item (movie or episode)
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
 *       404:
 *         description: Media not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/watch', toggleWatched);

/**
 * @swagger
 * /api/media/favorites:
 *   get:
 *     summary: Get all favorite media items (movies and episodes)
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: List of favorite media
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MediaEntry'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/favorites', getFavorites);

/**
 * @swagger
 * /api/media/watched:
 *   get:
 *     summary: Get all watched media items (movies and episodes)
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: List of watched media
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MediaEntry'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/watched', getWatched);

/**
 * @swagger
 * /api/media/{id}/position:
 *   put:
 *     summary: Set the playback position for a media item (movie or episode)
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
 *       404:
 *         description: Media not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/position', updatePlaybackPosition);

/**
 * @swagger
 * /api/media/{id}/position:
 *   get:
 *     summary: Get the current playback position for a media item (movie or episode)
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/position', getPlaybackPosition);

/**
 * @swagger
 * /api/media/{id}/poster:
 *   get:
 *     summary: Get the poster image for a media item (movie, episode, or series)
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *     Series:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "The Office"
 *         overview:
 *           type: string
 *           example: "A mockumentary on a group of typical office workers..."
 *         genre:
 *           type: string
 *           example: "Comedy"
 *         poster:
 *           type: string
 *           example: "/data/posters/the_office/poster.jpg"
 *         backdrop:
 *           type: string
 *           example: "/data/backdrops/the_office/backdrop.jpg"
 *         mediaType:
 *           type: string
 *           enum: [series, movie]
 *           example: "series"
 *         episodes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Episode'
 *     Episode:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 101
 *         title:
 *           type: string
 *           example: "Pilot"
 *         filepath:
 *           type: string
 *           example: "/Serien/The Office/Staffel 1/E01.mp4"
 *         poster:
 *           type: string
 *           example: "/data/posters/the_office/S1E1.jpg"
 *         year:
 *           type: string
 *           example: "2005"
 *         genre:
 *           type: string
 *           example: "Comedy"
 *         mediaType:
 *           type: string
 *           enum: [series, movie]
 *           example: "series"
 *         seriesId:
 *           type: integer
 *           example: 1
 *     MediaEntry:
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
 *           enum: [movie, series]
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
 *         seriesId:
 *           type: integer
 *           nullable: true
 *     SeriesSearchResult:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         overview:
 *           type: string
 *         poster:
 *           type: string
 *         year:
 *           type: string
 *         genre:
 *           type: string
 *         rating:
 *           type: number
 *         mediaType:
 *           type: string
 *         episodes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Episode'
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         currentPage:
 *           type: integer
 *         limit:
 *           type: integer
 *         hasNextPage:
 *           type: boolean
 *         hasPrevPage:
 *           type: boolean
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 */

export default router;
