CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    attributes JSONB NOT NULL,
    caption TEXT NOT NULL,
    confidence REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);