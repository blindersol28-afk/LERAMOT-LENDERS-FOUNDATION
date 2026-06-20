import Database from 'better-sqlite3';
import { join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const dbPath = 'leramot.db';
let db: Database.Database;

try {
  db = new Database(dbPath);
  // Quick sanity check to ensure the file is not corrupted
  db.pragma('journal_mode = WAL');
} catch (error: any) {
  console.error('SQLite Database error on startup (likely corrupted disk image). Recreating DB...', error);
  if (existsSync(dbPath)) {
    try {
      unlinkSync(dbPath);
      console.log('Corrupted database file deleted successfully.');
    } catch (unlinkError) {
      console.error('Failed to delete corrupted database file:', unlinkError);
    }
  }
  db = new Database(dbPath);
}

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    purpose TEXT,
    amount REAL NOT NULL,
    fundingSource TEXT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    birthday TEXT,
    email TEXT,
    phoneNumber TEXT NOT NULL,
    guarantorNumber TEXT,
    idNumber TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    autoPay INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    checkoutRequestID TEXT PRIMARY KEY,
    applicationId TEXT,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    paymentType TEXT DEFAULT 'insurance_fee',
    mpesaReceiptNumber TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicationId) REFERENCES applications(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Safe migrations for existing databases
try {
  db.exec(`ALTER TABLE applications ADD COLUMN autoPay INTEGER DEFAULT 0;`);
} catch (error) {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE payments ADD COLUMN paymentType TEXT DEFAULT 'insurance_fee';`);
} catch (error) {
  // Column already exists
}

export default db;
