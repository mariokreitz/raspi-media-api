import { openDb } from '../config/db.config.js';
import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { walkDir } from '../utils/walkDir.js';
import * as tmdbApi from '../utils/tmdbApi.js';
import { downloadImageFromTmdb, mapGenres } from '../utils/tmdbUtils.js';

const MEDIA_BASE_PATH = process.env.MEDIA_BASE_PATH || '/mnt/nas/Homeflix';
const MOVIES_DIR = process.env.MOVIES_DIR || 'Movies';
const SERIES_DIR = process.env.SERIES_DIR || 'Series';
const MEDIA_EXTENSIONS = (process.env.MEDIA_EXTENSIONS || '.mp4,.mkv,.avi,.mov')
    .split(',')
    .map(ext => ext.trim().toLowerCase());

/**
 * Fetches TMDB series data by title.
 */
const fetchTmdbSeriesData = async (seriesTitle) => {
    try {
        const response = await tmdbApi.searchTv(seriesTitle);
        const result = response.results?.[0];
        if (!result) {
            logger.warn(`No TMDB series found for: ${seriesTitle}`);
            return null;
        }
        return result;
    } catch (err) {
        logger.error(`Error fetching TMDB series data for ${seriesTitle}: ${err.message}`);
        return null;
    }
};

/**
 * Fetches TMDB episode data by series ID, season number, and episode number.
 */
const fetchTmdbEpisodeData = async (seriesId, seasonNumber, episodeNumber) => {
    try {
        const episodes = await tmdbApi.getSeasonEpisodes(seriesId, seasonNumber);
        return episodes.find(ep => ep.episode_number === episodeNumber) || null;
    } catch (err) {
        logger.warn(`Failed to fetch episode data for seriesId=${seriesId}, season=${seasonNumber}: ${err.message}`);
        return null;
    }
};

/**
 * Fetches TMDB metadata for a movie or series episode.
 * @param {string} filename
 * @param {string} filepath
 * @param {object} options
 * @returns {Promise<object>}
 */
const fetchTmdbData = async (filename, filepath, options = {}) => {
    const { seriesMeta, episodeMeta } = options;
    const isMovie = filepath.includes(`/${MOVIES_DIR}/`);
    const isSeries = filepath.includes(`/${SERIES_DIR}/`);
    let title = path.parse(filename).name;
    let description = '';
    let poster = '';
    let year = '';
    let genre = '';
    let language = '';
    let rating = 0;
    let mediaType = isMovie ? 'movie' : isSeries ? 'tv' : '';

    if (isMovie) {
        try {
            const response = await tmdbApi.searchMovie(title);
            const result = response.results?.[0];
            if (result) {
                title = result.title || title;
                description = result.overview || '';
                year = result.release_date?.split('-')[0] || '';
                genre = result.genre_ids ? mapGenres(result.genre_ids) : '';
                language = result.original_language || '';
                rating = result.vote_average || 0;
                if (result.poster_path) {
                    poster = await downloadImageFromTmdb(
                        result.poster_path,
                        'poster.jpg',
                        'poster',
                        title,
                    );
                }
            }
        } catch (err) {
            logger.warn(`TMDB movie fetch failed for ${title}: ${err.message}`);
        }
    } else if (isSeries && seriesMeta) {
        const mediaTitle = seriesMeta.name || title;
        title = episodeMeta?.name || mediaTitle;
        description = episodeMeta?.overview || seriesMeta.overview || '';
        year = episodeMeta?.air_date?.split('-')[0] || seriesMeta.first_air_date?.split('-')[0] || '';
        genre = seriesMeta.genre_ids ? mapGenres(seriesMeta.genre_ids) : '';
        language = seriesMeta.original_language || '';
        rating = episodeMeta?.vote_average || seriesMeta.vote_average || 0;
        if (episodeMeta?.still_path) {
            poster = await downloadImageFromTmdb(
                episodeMeta.still_path,
                `S${episodeMeta.season_number}E${episodeMeta.episode_number}.jpg`,
                'poster',
                mediaTitle,
            );
        } else if (seriesMeta.poster_path) {
            poster = await downloadImageFromTmdb(
                seriesMeta.poster_path,
                'poster.jpg',
                'poster',
                mediaTitle,
            );
        }
    }
    return {
        title,
        description,
        poster,
        year,
        genre,
        language,
        rating,
        mediaType,
    };
};

/**
 * Returns a paginated list of all series with nested episodes.
 */
export const getMedia = async (req, res, next) => {
    try {
        const db = await openDb();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { genre, mediaType } = req.query;
        const whereClause = [];
        const params = [];
        if (genre) {
            whereClause.push('genre LIKE ?');
            params.push(`%${genre}%`);
        }
        if (mediaType) {
            whereClause.push('mediaType = ?');
            params.push(mediaType);
        }
        const whereStatement = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
        const countQuery = `SELECT COUNT(*) as total
                            FROM series ${whereStatement}`;
        const countResult = await db.get(countQuery, params);
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);
        const seriesQuery = `
            SELECT *
            FROM series ${whereStatement}
            ORDER BY title
            LIMIT ? OFFSET ?
        `;
        const seriesRows = await db.all(seriesQuery, [...params, limit, offset]);
        const series = [];
        for (const s of seriesRows) {
            const episodes = await db.all(
                'SELECT * FROM media WHERE seriesId = ? ORDER BY title',
                [s.id],
            );
            series.push({
                id: s.id,
                title: s.title,
                overview: s.overview,
                genre: s.genre,
                poster: s.poster_path,
                backdrop: s.backdrop_path,
                mediaType: s.mediaType,
                episodes,
            });
        }
        logger.info(`Fetched ${series.length} series (page ${page})`);
        res.json({
            series,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (err) {
        logger.error(`Error fetching media: ${err.message}`);
        next(new AppError('Error fetching media', 500));
    }
};

/**
 * Returns a list of all available genres.
 */
export const getGenres = async (req, res, next) => {
    try {
        const db = await openDb();
        const rows = await db.all('SELECT genre FROM media WHERE genre IS NOT NULL');
        const genreSet = new Set();
        rows.forEach(row => row.genre?.split(',').forEach(g => genreSet.add(g.trim())));
        logger.info(`Fetched ${genreSet.size} genres`);
        res.json([...genreSet].sort());
    } catch (err) {
        logger.error(`Error fetching genres: ${err.message}`);
        next(new AppError('Error fetching genres', 500));
    }
};

/**
 * Scans media directories and indexes all media files and series.
 */
export const scanMedia = async (req, res, next) => {
    const db = await openDb();
    if (!process.env.TMDB_API_KEY) {
        logger.error('TMDB_API_KEY is missing in environment variables');
        return next(new AppError('TMDB_API_KEY is missing in environment variables', 500));
    }
    const baseDirs = [
        path.join(MEDIA_BASE_PATH, MOVIES_DIR),
        path.join(MEDIA_BASE_PATH, SERIES_DIR),
    ];
    const invalidDirs = baseDirs.filter(dir => !fs.existsSync(dir));
    if (invalidDirs.length > 0) {
        logger.error(`Directories do not exist: ${invalidDirs.join(', ')}`);
        return next(new AppError(`Directories do not exist: ${invalidDirs.join(', ')}`, 500));
    }
    try {
        let allFiles = [];
        let scanErrors = [];
        for (const baseDir of baseDirs) {
            try {
                const files = walkDir(baseDir, MEDIA_EXTENSIONS);
                allFiles = allFiles.concat(files);
            } catch (err) {
                logger.error(`Error scanning directory ${baseDir}: ${err.message}`);
                scanErrors.push(`${baseDir}: ${err.message}`);
            }
        }
        if (allFiles.length === 0 && scanErrors.length > 0) {
            logger.error(`Failed to scan media directories: ${scanErrors.join('; ')}`);
            return next(new AppError(`Failed to scan media directories: ${scanErrors.join('; ')}`, 500));
        }

        const processFile = async (filepath) => {
            try {
                const exists = await db.get('SELECT 1 FROM media WHERE filepath = ?', [filepath]);
                if (exists) return { status: 'skipped', filepath };

                const filename = path.basename(filepath);
                const filesize = fs.statSync(filepath).size;
                const isSeries = filepath.includes(`/${SERIES_DIR}/`);
                let seriesId = null;
                let seriesMeta = null;
                let episodeMeta = null;

                if (isSeries) {
                    const parts = filepath.split(path.sep);
                    const seriesIdx = parts.findIndex(p => p === SERIES_DIR);
                    const seasonMatch = filepath.match(/(?:Staffel|Season)[\s_]?(\d+)/i);
                    const episodeMatch = filename.match(/E(\d+)/i);
                    let seriesName = (seriesIdx >= 0 && parts.length > seriesIdx + 1) ? parts[seriesIdx + 1] : null;
                    let seasonNumber = seasonMatch ? parseInt(seasonMatch[1], 10) : 1;
                    let episodeNumber = episodeMatch ? parseInt(episodeMatch[1], 10) : 1;

                    if (seriesName) {
                        seriesMeta = await fetchTmdbSeriesData(seriesName);
                        if (seriesMeta) {
                            seriesId = await upsertSeries(db, seriesMeta);
                            episodeMeta = await fetchTmdbEpisodeData(seriesMeta.id, seasonNumber, episodeNumber);
                        } else {
                            // fallback: upsert minimal series entry
                            seriesId = await upsertSeries(db, { name: seriesName });
                        }
                    }
                }

                const tmdbData = await fetchTmdbData(filename, filepath, { seriesMeta, episodeMeta });

                await db.run(
                    `INSERT INTO media
                     (filename, filepath, filesize, title, description, poster, year, genre, language, rating,
                      mediaType, favorite, watched, playback_position, last_played, seriesId)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, NULL, ?)`,
                    [
                        filename,
                        filepath,
                        filesize,
                        tmdbData.title,
                        tmdbData.description,
                        tmdbData.poster,
                        tmdbData.year,
                        tmdbData.genre,
                        tmdbData.language,
                        tmdbData.rating,
                        tmdbData.mediaType,
                        seriesId,
                    ],
                );
                logger.info(`Indexed: ${filepath}`);
                return { status: 'processed', filepath };
            } catch (err) {
                logger.error(`Error processing file ${filepath}: ${err.message}`);
                return { status: 'error', filepath, error: err.message };
            }
        };

        const results = await Promise.allSettled(allFiles.map(processFile));
        const processed = results.filter(r => r.status === 'fulfilled' && r.value.status === 'processed').length;
        const errors = results.filter(r => r.status === 'fulfilled' && r.value.status === 'error').length;

        if (errors && !processed) {
            logger.error(`Media scan completed with errors: All files failed to process`);
            return next(new AppError(`Media scan completed with errors: All files failed to process`, 500));
        }
        const message = errors
            ? `Media scan completed: ${processed} files processed, ${errors} files failed`
            : `Media scan completed: ${processed} files processed successfully`;
        logger.info(message);
        res.send(message);
    } catch (err) {
        logger.error(`Error scanning media: ${err.message}`);
        next(new AppError(`Error scanning media: ${err.message}`, 500));
    }
};

/**
 * Streams a media file (movie or episode) by its ID.
 */
export const streamMedia = async (req, res, next) => {
    try {
        const db = await openDb();
        const media = await db.get('SELECT * FROM media WHERE id = ?', [req.params.id]);
        if (!media) {
            logger.warn(`Media not found for id=${req.params.id}`);
            return next(new AppError('Media not found', 404));
        }
        const filepath = media.filepath;
        const stat = fs.statSync(filepath);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
            const start = parseInt(startStr, 10);
            const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
            const chunkSize = end - start + 1;
            const file = fs.createReadStream(filepath, { start, end });
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
            });
            file.pipe(res);
            logger.info(`Streaming media id=${req.params.id} range=${start}-${end}`);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            });
            fs.createReadStream(filepath).pipe(res);
            logger.info(`Streaming full media id=${req.params.id}`);
        }
    } catch (err) {
        logger.error(`Error streaming media: ${err.message}`);
        next(new AppError('Error streaming media', 500));
    }
};

/**
 * Searches for movies and series episodes by title, description, or filename.
 */
export const searchMedia = async (req, res, next) => {
    try {
        const db = await openDb();
        const q = `%${req.query.q || ''}%`;
        const results = await db.all(`
            SELECT *
            FROM media
            WHERE title LIKE ?
               OR description LIKE ?
               OR filename LIKE ?
        `, [q, q, q]);
        const movies = results.filter(item => item.mediaType === 'movie');
        const tvEpisodes = results.filter(item => item.mediaType === 'tv');
        const seriesMap = new Map();
        for (const episode of tvEpisodes) {
            const pathParts = episode.filepath.split(path.sep);
            const seriesIndex = pathParts.findIndex(part => part === SERIES_DIR);
            let seriesName = 'Unknown Series';
            if (seriesIndex >= 0 && seriesIndex < pathParts.length - 1) {
                seriesName = pathParts[seriesIndex + 1];
            }
            if (!seriesMap.has(seriesName)) {
                seriesMap.set(seriesName, {
                    name: seriesName,
                    overview: episode.description || '',
                    poster: episode.poster || '',
                    year: episode.year || '',
                    genre: episode.genre || '',
                    rating: episode.rating || 0,
                    mediaType: 'tvSeries',
                    episodes: [],
                });
                try {
                    const searchResult = await tmdbApi.searchTv(seriesName);
                    const seriesDetails = searchResult.results?.[0];
                    if (seriesDetails) {
                        seriesMap.get(seriesName).overview = seriesDetails.overview || '';
                        seriesMap.get(seriesName).year = seriesDetails.first_air_date?.split('-')[0] || '';
                        if (seriesDetails.poster_path) {
                            seriesMap.get(seriesName).poster = await downloadImageFromTmdb(
                                seriesDetails.poster_path,
                                'poster.jpg',
                                'poster',
                                seriesName,
                            );
                        }
                    }
                } catch (err) {
                    logger.warn(`Failed to fetch TMDB data for series ${seriesName}: ${err.message}`);
                }
            }
            seriesMap.get(seriesName).episodes.push(episode);
        }
        const series = Array.from(seriesMap.values());
        logger.info(`Search returned ${movies.length} movies and ${series.length} series`);
        res.json({
            movies,
            series,
        });
    } catch (err) {
        logger.error(`Error searching media: ${err.message}`);
        next(new AppError('Error searching media', 500));
    }
};

/**
 * Updates the playback position for a media item.
 */
export const updatePlaybackPosition = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { position } = req.body;
        const db = await openDb();
        await db.run(
            'UPDATE media SET playback_position = ?, last_played = CURRENT_TIMESTAMP WHERE id = ?',
            [position, id],
        );
        logger.info(`Updated playback position for media id=${id} to ${position}`);
        res.status(200).json({ message: 'Playback position updated' });
    } catch (err) {
        logger.error(`Error updating playback position: ${err.message}`);
        next(new AppError('Error updating playback position', 500));
    }
};

/**
 * Gets the current playback position for a media item.
 */
export const getPlaybackPosition = async (req, res, next) => {
    try {
        const { id } = req.params;
        const db = await openDb();
        const media = await db.get(
            'SELECT playback_position, last_played FROM media WHERE id = ?',
            [id],
        );
        if (!media) {
            logger.warn(`Media not found for id=${id}`);
            return next(new AppError('Media not found', 404));
        }
        logger.info(`Fetched playback position for media id=${id}`);
        res.status(200).json(media);
    } catch (err) {
        logger.error(`Error fetching playback position: ${err.message}`);
        next(new AppError('Error fetching playback position', 500));
    }
};

/**
 * Toggles the favorite status for a media item.
 */
export const toggleFavorite = async (req, res, next) => {
    try {
        const db = await openDb();
        await db.run('UPDATE media SET favorite = NOT favorite WHERE id = ?', [req.params.id]);
        logger.info(`Toggled favorite status for media id=${req.params.id}`);
        res.status(200).json({ message: 'Favorite status toggled' });
    } catch (err) {
        logger.error(`Error toggling favorite status: ${err.message}`);
        next(new AppError('Error toggling favorite status', 500));
    }
};

/**
 * Toggles the watched status for a media item.
 */
export const toggleWatched = async (req, res, next) => {
    try {
        const db = await openDb();
        await db.run('UPDATE media SET watched = NOT watched WHERE id = ?', [req.params.id]);
        logger.info(`Toggled watched status for media id=${req.params.id}`);
        res.status(200).json({ message: 'Watched status toggled' });
    } catch (err) {
        logger.error(`Error toggling watched status: ${err.message}`);
        next(new AppError('Error toggling watched status', 500));
    }
};

/**
 * Returns all favorite media items.
 */
export const getFavorites = async (req, res, next) => {
    try {
        const db = await openDb();
        const results = await db.all('SELECT * FROM media WHERE favorite = 1');
        logger.info(`Fetched ${results.length} favorite media items`);
        res.json(results);
    } catch (err) {
        logger.error(`Error fetching favorites: ${err.message}`);
        next(new AppError('Error fetching favorites', 500));
    }
};

/**
 * Returns all watched media items.
 */
export const getWatched = async (req, res, next) => {
    try {
        const db = await openDb();
        const results = await db.all('SELECT * FROM media WHERE watched = 1');
        logger.info(`Fetched ${results.length} watched media items`);
        res.json(results);
    } catch (err) {
        logger.error(`Error fetching watched media: ${err.message}`);
        next(new AppError('Error fetching watched media', 500));
    }
};

/**
 * Returns statistics about the media catalog.
 */
export const getStats = async (req, res, next) => {
    try {
        const db = await openDb();
        const total = await db.get('SELECT COUNT(*) as count FROM media');
        const watched = await db.get('SELECT COUNT(*) as count FROM media WHERE watched = 1');
        const favorites = await db.get('SELECT COUNT(*) as count FROM media WHERE favorite = 1');
        const size = await db.get('SELECT SUM(filesize) as total FROM media');
        logger.info('Fetched media statistics');
        res.json({
            total: total.count,
            watched: watched.count,
            favorites: favorites.count,
            totalSizeGB: (size.total || 0) / (1024 ** 3),
        });
    } catch (err) {
        logger.error(`Error fetching statistics: ${err.message}`);
        next(new AppError('Error fetching statistics', 500));
    }
};

/**
 * Inserts or updates a series entry in the database with TMDB metadata and local images.
 * @param {object} db
 * @param {object} seriesData
 * @returns {Promise<number>} The series ID
 */
export async function upsertSeries(db, seriesData) {
    const {
        name,
        original_name,
        overview,
        first_air_date,
        poster_path,
        backdrop_path,
        genre_ids,
        original_language,
        origin_country,
        popularity,
        vote_average,
        vote_count,
        mediaType = 'series',
    } = seriesData;

    const existing = await db.get('SELECT id FROM series WHERE title = ?', [name]);
    if (existing) {
        return existing.id;
    }

    let genre = '';
    if (Array.isArray(genre_ids)) {
        genre = mapGenres(genre_ids);
    }

    const originCountry = Array.isArray(origin_country) ? origin_country.join(',') : '';

    let posterLocal = '';
    let backdropLocal = '';
    if (poster_path) {
        posterLocal = await downloadImageFromTmdb(
            poster_path,
            'poster.jpg',
            'poster',
            name,
        );
    }
    if (backdrop_path) {
        backdropLocal = await downloadImageFromTmdb(
            backdrop_path,
            'backdrop.jpg',
            'backdrop',
            name,
        );
    }

    const stmt = await db.prepare(
        `INSERT INTO series
         (title, original_name, overview, first_air_date, poster_path, backdrop_path, genre, original_language,
          origin_country, popularity, vote_average, vote_count, mediaType)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const result = await stmt.run(
        name,
        original_name || '',
        overview || '',
        first_air_date || '',
        posterLocal,
        backdropLocal,
        genre,
        original_language || '',
        originCountry,
        popularity || 0,
        vote_average || 0,
        vote_count || 0,
        mediaType,
    );
    await stmt.finalize();
    return result.lastID;
}
