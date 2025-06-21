import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function openDb() {
    const db = await open({
        filename: './data/media_catalog.db',
        driver: sqlite3.Database,
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS media
        (
            id
            INTEGER
            PRIMARY
            KEY
            AUTOINCREMENT,
            filename
            TEXT,
            filepath
            TEXT,
            filesize
            INTEGER,
            title
            TEXT,
            description
            TEXT,
            poster
            TEXT,
            year
            TEXT,
            genre
            TEXT,
            language
            TEXT,
            rating
            REAL,
            watched
            INTEGER
            DEFAULT
            0,
            favorite
            INTEGER
            DEFAULT
            0
        )
    `);

    return db;
}
