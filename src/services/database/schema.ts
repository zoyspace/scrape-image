import { getClient } from "./client.ts";

export async function ensureSchema() {
	const client = getClient();

	await client.execute(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS posts(
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      groupName  TEXT NOT NULL,
      memberName TEXT,
      title      TEXT,
      urlId      INTEGER NOT NULL,
      articleUrl TEXT,
      postedAt   TEXT,  -- ISO: YYYY-MM-DD HH:MM:SS,
      isXPosted  INTEGER NOT NULL DEFAULT 0,
      createdAt  TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(groupName, urlId)
    );
    `);

	await client.execute(`
    CREATE TABLE IF NOT EXISTS images(
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      postId     INTEGER NOT NULL,
      memberName TEXT,
      postedAt   TEXT,
      imageUrl   TEXT NOT NULL,
      createdAt  TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(postId, imageUrl),
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
    );
    `);

	await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_posts_postedAt
      ON posts (postedAt);
    `);

	await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_images_postedAt
      ON images (postedAt);
  `);
	await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_posts_isXPosted_postedAt
      ON posts (isXPosted, postedAt );
  `);
}
