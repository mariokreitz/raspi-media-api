import express from 'express';
import {
    getFavorites,
    getMedia,
    getStats,
    getWatched,
    scanMedia,
    searchMedia,
    streamMedia,
    toggleFavorite,
    toggleWatched,
} from '../controllers/media.controller.js';

const router = express.Router();

router.get('/', getMedia);
router.post('/scan', scanMedia);
router.get('/stream/:id', streamMedia);
router.get('/search', searchMedia);
router.patch('/:id/favorite', toggleFavorite);
router.patch('/:id/watch', toggleWatched);
router.get('/favorites', getFavorites);
router.get('/watched', getWatched);
router.get('/stats', getStats);

export default router;
