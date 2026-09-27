CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vk_user_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'participant',
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  poster_no INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  idea TEXT NOT NULL,
  problem TEXT,
  author TEXT,
  group_name TEXT,
  contact TEXT,
  tools TEXT,
  ai_how TEXT NOT NULL,
  contribution TEXT,
  interactive INTEGER NOT NULL DEFAULT 0,
  interactive_url TEXT,
  image_key TEXT,
  status TEXT NOT NULL DEFAULT 'moderation',
  audience_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL,
  jury_user_id TEXT NOT NULL,
  idea INTEGER NOT NULL,
  english INTEGER NOT NULL,
  originality INTEGER NOT NULL,
  design INTEGER NOT NULL,
  digital INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(submission_id, jury_user_id),
  FOREIGN KEY(submission_id) REFERENCES submissions(id)
);