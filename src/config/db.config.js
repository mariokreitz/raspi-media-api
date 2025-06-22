import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DB_PATH || './data/media_catalog.db';

const ensureDbDir = () => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

export async function openDb() {
    ensureDbDir();

    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database,
    });

    await db.exec(`CREATE TABLE IF NOT EXISTS media
                   (
                       id                INTEGER PRIMARY KEY AUTOINCREMENT,
                       filename          TEXT,
                       filepath          TEXT UNIQUE,
                       filesize          INTEGER,
                       title             TEXT,
                       mediaType         TEXT,
                       description       TEXT,
                       poster            TEXT,
                       year              TEXT,
                       genre             TEXT,
                       language          TEXT,
                       rating            REAL,
                       watched           INTEGER DEFAULT 0,
                       favorite          INTEGER DEFAULT 0,
                       playback_position INTEGER DEFAULT 0,
                       last_played       TIMESTAMP,
                       seriesId          INTEGER
                   )
    `);

    await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_media_filepath ON media (filepath);
        CREATE INDEX IF NOT EXISTS idx_media_title ON media (title);
        CREATE INDEX IF NOT EXISTS idx_media_genre ON media (genre);
        CREATE INDEX IF NOT EXISTS idx_media_mediaType ON media (mediaType);
        CREATE INDEX IF NOT EXISTS idx_media_favorite ON media (favorite);
        CREATE INDEX IF NOT EXISTS idx_media_watched ON media (watched);
        CREATE INDEX IF NOT EXISTS idx_media_seriesId ON media (seriesId);
    `);

    await db.exec(`CREATE TABLE IF NOT EXISTS series
                   (
                       id                INTEGER PRIMARY KEY AUTOINCREMENT,
                       title             TEXT NOT NULL,
                       original_name     TEXT,
                       overview          TEXT,
                       first_air_date    TEXT,
                       poster_path       TEXT,
                       backdrop_path     TEXT,
                       genre             TEXT,
                       original_language TEXT,
                       origin_country    TEXT,
                       popularity        REAL,
                       vote_average      REAL,
                       vote_count        INTEGER,
                       mediaType         TEXT
                   )
    `);

    await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_series_title ON series (title);
        CREATE INDEX IF NOT EXISTS idx_series_genre ON series (genre);
        CREATE INDEX IF NOT EXISTS idx_series_mediaType ON series (mediaType);
    `);

    return db;
}