import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * TMDB genre ID to name mapping.
 */
export const GENRE_MAP = {
    16: 'Animation',
    18: 'Drama',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    10751: 'Family',
    10759: 'Action & Adventure',
    10762: 'Kids',
    10763: 'News',
    10764: 'Reality',
    10765: 'Sci-Fi & Fantasy',
    10766: 'Soap',
    10767: 'Talk',
    10768: 'War & Politics',
    28: 'Action',
    12: 'Adventure',
    14: 'Fantasy',
    27: 'Horror',
    36: 'History',
    53: 'Thriller',
    10749: 'Romance',
    10402: 'Music',
    9648: 'Mystery',
    878: 'Science Fiction',
    37: 'Western',
    10770: 'TV Movie',
};

/**
 * Get genre name by TMDB genre ID.
 * @param {number} id
 * @returns {string}
 */
export function getGenreNameById(id) {
    return GENRE_MAP[id] || String(id);
}

/**
 * Map an array of TMDB genre IDs to a comma-separated string of genre names.
 * @param {number[]} genreIds
 * @returns {string}
 */
export function mapGenres(genreIds) {
    if (!Array.isArray(genreIds)) return '';
    return genreIds.map(getGenreNameById).filter(Boolean).join(', ');
}

/**
 * Sanitize a string for use as a folder name.
 * @param {string} name
 * @returns {string}
 */
function sanitizeFolderName(name) {
    return (name || 'unknown')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();
}

/**
 * Download an image from TMDB and save it locally in a media-specific subfolder.
 * @param {string} imagePath - The TMDB image path (e.g. /abc123.jpg)
 * @param {string} filename - The local filename to save as (e.g. poster_myseries.jpg)
 * @param {string} [type='poster'] - 'poster' or 'backdrop'
 * @param {string} [mediaTitle=''] - The media title for folder organization
 * @returns {Promise<string>} The local relative path (e.g. /data/posters/title/file.jpg) or '' on failure
 */
export async function downloadImageFromTmdb(imagePath, filename, type = 'poster', mediaTitle = '') {
    if (!imagePath) return '';
    const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';
    const sanitizedTitle = sanitizeFolderName(mediaTitle);
    const baseDir = path.resolve('./data', type === 'backdrop' ? 'backdrops' : 'posters', sanitizedTitle);
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }
    const localPath = `/data/${type === 'backdrop' ? 'backdrops' : 'posters'}/${sanitizedTitle}/${filename}`;
    const fullLocalPath = path.join(baseDir, filename);
    try {
        const url = `${TMDB_IMAGE_BASE}${imagePath}`;
        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        const writer = fs.createWriteStream(fullLocalPath);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        return localPath;
    } catch (err) {
        return '';
    }
}
