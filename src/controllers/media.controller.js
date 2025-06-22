import { openDb } from '../config/db.config.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { genreMap } from '../utils/tmdbGenres.js';
import { walkDir } from '../utils/helper.js';

const MEDIA_BASE_PATH = process.env.MEDIA_BASE_PATH || '/mnt/nas/Homeflix';
const MOVIES_DIR = process.env.MOVIES_DIR || 'Movies';
const SERIES_DIR = process.env.SERIES_DIR || 'Series';
const MEDIA_EXTENSIONS = (process.env.MEDIA_EXTENSIONS || '.mp4,.mkv,.avi,.mov')
    .split(',')
    .map(ext => ext.trim().toLowerCase());


export const getPoster = async (req, res, next) => {
    try {
        const { id } = req.params;

        const db = await openDb();
        const media = await db.get('SELECT poster FROM media WHERE id = ?', [id]);

        if (!media || !media.poster) {
            return next(new AppError('Poster not found', 404));
        }

        const posterPath = path.isAbsolute(media.poster)
            ? media.poster
            : path.resolve(process.cwd(), media.poster);


        if (!fs.existsSync(posterPath)) {
            return next(new AppError('Poster file not found', 404));
        }

        res.sendFile(posterPath);
    } catch (error) {
        next(new AppError('Error retrieving poster', 500));
    }
};

export const getMedia = async (req, res, next) => {
    try {
        const db = await openDb();
        const { genre } = req.query;
        let query = 'SELECT * FROM media';
        const params = [];

        if (genre) {
            query += ' WHERE genre LIKE ?';
            params.push(`%${genre}%`);
        }

        const media = await db.all(query, params);
        res.json(media);
    } catch {
        next(new AppError('Error fetching media', 500));
    }
};

export const getGenres = async (req, res, next) => {
    try {
        const db = await openDb();
        const rows = await db.all('SELECT genre FROM media WHERE genre IS NOT NULL');
        const genreSet = new Set();
        rows.forEach(row => row.genre?.split(',').forEach(g => genreSet.add(g.trim())));
        res.json([...genreSet].sort());
    } catch {
        next(new AppError('Error fetching genres', 500));
    }
};

export const scanMedia = async (req, res, next) => {
    const db = await openDb();

    if (!process.env.TMDB_API_KEY) {
        return next(new AppError('TMDB_API_KEY is missing in environment variables', 500));
    }

    const baseDirs = [
        path.join(MEDIA_BASE_PATH, MOVIES_DIR),
        path.join(MEDIA_BASE_PATH, SERIES_DIR),
    ];

    const invalidDirs = baseDirs.filter(dir => !fs.existsSync(dir));
    if (invalidDirs.length > 0) {
        return next(new AppError(`Directories do not exist: ${invalidDirs.join(', ')}`, 500));
    }

    try {
        let allFiles = [];
        let scanErrors = [];

        for (const baseDir of baseDirs) {
            try {
                const files = walkDir(baseDir, MEDIA_EXTENSIONS);
                allFiles = allFiles.concat(files);
                logger.info(`Found ${files.length} media files in ${baseDir}`);
            } catch (err) {
                logger.error(`Error scanning directory ${baseDir}:`, err);
                scanErrors.push(`${baseDir}: ${err.message}`);
            }
        }

        if (allFiles.length === 0 && scanErrors.length > 0) {
            return next(new AppError(`Failed to scan media directories: ${scanErrors.join('; ')}`, 500));
        }

        logger.info(`Total of ${allFiles.length} media files found`);

        let processed = 0;
        let errors = 0;

        for (const filepath of allFiles) {
            try {
                const exists = await db.get('SELECT 1 FROM media WHERE filepath = ?', [filepath]);
                if (exists) continue;

                const filename = path.basename(filepath);
                const filesize = fs.statSync(filepath).size;
                logger.info(`Processing: ${filename}`);
                const tmdbData = await fetchTmdbData(filename, filepath);

                await db.run(
                    `INSERT INTO media
                     (filename, filepath, filesize, title, description, poster, year, genre, language, rating,
                      mediaType)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                    ],
                );
                processed++;
            } catch (fileErr) {
                logger.error(`Error processing file ${filepath}:`, fileErr);
                errors++;
            }
        }

        if (errors && !processed) {
            return next(new AppError(`Media scan completed with errors: All ${errors} files failed to process`, 500));
        } else {
            const message = errors
                ? `Media scan completed: ${processed} files processed, ${errors} files failed`
                : `Media scan completed: ${processed} files processed successfully`;
            res.send(message);
        }
    } catch (err) {
        logger.error('Error during media scan:', err);
        next(new AppError(`Error scanning media: ${err.message}`, 500));
    }
};

const downloadPoster = async (url, filename) => {
    const posterDir = path.resolve('data/posters');
    if (!fs.existsSync(posterDir)) fs.mkdirSync(posterDir, { recursive: true });

    const posterPath = path.join(posterDir, filename);
    const writer = fs.createWriteStream(posterPath);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });

    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(posterPath));
        writer.on('error', reject);
    });
};

const fetchTmdbData = async (filename, filepath) => {
    const apiKey = process.env.TMDB_API_KEY;

    let query = path.parse(filename).name;

    if (query.includes('-')) {
        query = query.split('-').slice(1).join('-').trim();
    }

    logger.info(`Searching for: ${query}`);

    try {
        const isMovie = filepath.includes(`/${MOVIES_DIR}/`);
        const isSeries = filepath.includes(`/${SERIES_DIR}/`);

        let result;

        if (isMovie) {
            const response = await axios.get(
                `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`,
            );
            result = response.data.results?.[0];
            logger.info(`Found movie match for ${query}`);
        } else if (isSeries) {
            const response = await axios.get(
                `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}`,
            );
            result = response.data.results?.[0];
            logger.info(`Found TV series match for ${query}`);
        } else {
            const [movieResponse, tvResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`),
                axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}`),
            ]);

            const movie = movieResponse.data.results?.[0];
            const tvShow = tvResponse.data.results?.[0];

            const useMovie = !tvShow || (movie && movie.popularity > tvShow.popularity);
            result = useMovie ? movie : tvShow;
            logger.info(`Used fallback search for ${query}, found ${useMovie ? 'movie' : 'TV series'}`);
        }

        if (!result) {
            return { title: query, description: '', poster: '', year: '', genre: '', language: '', rating: 0 };
        }

        const isMovieResult = isMovie || (!isSeries && result.title);

        const genres = result.genre_ids ? mapGenres(result.genre_ids) : '';
        const title = isMovieResult ? (result.title || query) : (result.name || query);
        const year = isMovieResult
            ? result.release_date?.split('-')[0] || ''
            : result.first_air_date?.split('-')[0] || '';

        let poster = '';
        if (result.poster_path) {
            const posterUrl = `https://image.tmdb.org/t/p/w500${result.poster_path}`;
            poster = await downloadPoster(posterUrl, `${query}.jpg`);
        }

        return {
            title,
            description: result.overview || '',
            poster,
            year,
            genre: genres,
            language: result.original_language || '',
            rating: result.vote_average || 0,
            mediaType: isMovieResult ? 'movie' : 'tv',
        };
    } catch (error) {
        logger.error('Error fetching TMDb data:', error);
        return { title: query, description: '', poster: '', year: '', genre: '', language: '', rating: 0 };
    }
};

export const streamMedia = async (req, res, next) => {
    try {
        const db = await openDb();
        const media = await db.get('SELECT * FROM media WHERE id = ?', [req.params.id]);
        if (!media) return next(new AppError('Media not found', 404));

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
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            });
            fs.createReadStream(filepath).pipe(res);
        }
    } catch {
        next(new AppError('Error streaming media', 500));
    }
};

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
        res.json(results);
    } catch {
        next(new AppError('Error searching media', 500));
    }
};

export const updatePlaybackPosition = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { position } = req.body;

        const db = await openDb();
        await db.run(
            'UPDATE media SET playback_position = ?, last_played = CURRENT_TIMESTAMP WHERE id = ?',
            [position, id],
        );

        res.status(200).json({ message: 'Wiedergabeposition aktualisiert' });
    } catch (error) {
        next(new AppError('Fehler beim Aktualisieren der Wiedergabeposition', 500));
    }
};

export const getPlaybackPosition = async (req, res, next) => {
    try {
        const { id } = req.params;

        const db = await openDb();
        const media = await db.get(
            'SELECT playback_position, last_played FROM media WHERE id = ?',
            [id],
        );

        if (!media) {
            return next(new AppError('Medium nicht gefunden', 404));
        }

        res.status(200).json(media);
    } catch (error) {
        next(new AppError('Fehler beim Abrufen der Wiedergabeposition', 500));
    }
};

export const toggleFavorite = async (req, res, next) => {
    try {
        const db = await openDb();
        await db.run('UPDATE media SET favorite = NOT favorite WHERE id = ?', [req.params.id]);
        res.send('Favorite status toggled');
    } catch {
        next(new AppError('Error toggling favorite status', 500));
    }
};

export const toggleWatched = async (req, res, next) => {
    try {
        const db = await openDb();
        await db.run('UPDATE media SET watched = NOT watched WHERE id = ?', [req.params.id]);
        res.send('Watched status toggled');
    } catch {
        next(new AppError('Error toggling watched status', 500));
    }
};

export const getFavorites = async (req, res, next) => {
    try {
        const db = await openDb();
        const results = await db.all('SELECT * FROM media WHERE favorite = 1');
        res.json(results);
    } catch {
        next(new AppError('Error fetching favorites', 500));
    }
};

export const getWatched = async (req, res, next) => {
    try {
        const db = await openDb();
        const results = await db.all('SELECT * FROM media WHERE watched = 1');
        res.json(results);
    } catch {
        next(new AppError('Error fetching watched media', 500));
    }
};

export const getStats = async (req, res, next) => {
    try {
        const db = await openDb();
        const total = await db.get('SELECT COUNT(*) as count FROM media');
        const watched = await db.get('SELECT COUNT(*) as count FROM media WHERE watched = 1');
        const favorites = await db.get('SELECT COUNT(*) as count FROM media WHERE favorite = 1');
        const size = await db.get('SELECT SUM(filesize) as total FROM media');
        res.json({
            total: total.count,
            watched: watched.count,
            favorites: favorites.count,
            totalSizeGB: (size.total || 0) / (1024 ** 3),
        });
    } catch {
        next(new AppError('Error fetching statistics', 500));
    }
};

const mapGenres = genreIds =>
    genreIds.map(id => genreMap[id]).filter(Boolean).join(', ');
