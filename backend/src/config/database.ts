/**
 * Database Configuration and Initialization
 * SQLite database setup with migrations support
 */

import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database/inspections.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
/**
 * Initialize database connection
 */
const dbase: DatabaseType = new Database(DB_PATH, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
});

// Enable foreign keys
dbase.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 */
function initializeDatabase() {
    try {
        // Inspections Table
        dbase.exec(`
      CREATE TABLE IF NOT EXISTS inspections (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT NOT NULL,
        vehicle_name TEXT,
        pickup_date DATETIME NOT NULL,
        return_date DATETIME,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Images Table
        dbase.exec(`
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        inspection_id TEXT NOT NULL,
        image_type TEXT NOT NULL,
        original_filename TEXT,
        stored_path TEXT,
        s3_url TEXT,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
      )
    `);

        // Damages Table
        dbase.exec(`
      CREATE TABLE IF NOT EXISTS damages (
        id TEXT PRIMARY KEY,
        inspection_id TEXT NOT NULL,
        image_id TEXT NOT NULL,
        description TEXT,
        severity TEXT,
        estimated_cost REAL,
        location TEXT,
        ai_confidence REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
      )
    `);

        // Comparisons Table
        dbase.exec(`
      CREATE TABLE IF NOT EXISTS comparisons (
        id TEXT PRIMARY KEY,
        inspection_id TEXT NOT NULL,
        pickup_image_id TEXT,
        return_image_id TEXT,
        new_damages_count INTEGER DEFAULT 0,
        total_estimated_cost REAL DEFAULT 0,
        comparison_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
        FOREIGN KEY (pickup_image_id) REFERENCES images(id),
        FOREIGN KEY (return_image_id) REFERENCES images(id)
      )
    `);

        // Create indexes for performance
        dbase.exec(`
      CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id ON inspections(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_images_inspection_id ON images(inspection_id);
      CREATE INDEX IF NOT EXISTS idx_damages_inspection_id ON damages(inspection_id);
      CREATE INDEX IF NOT EXISTS idx_comparisons_inspection_id ON comparisons(inspection_id);
    `);

        console.log('✓ Database initialized successfully');
    } catch (error) {
        console.error('✗ Database initialization failed:', error);
        throw error;
    }
}

// Initialize on import
initializeDatabase();

export { dbase as db, DB_PATH };