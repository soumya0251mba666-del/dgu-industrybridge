import fs from 'node:fs';
import path from 'node:path';
import { createSeedData, type DatabaseState } from './seed';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'industrybridge-db.json');

let memoryState: DatabaseState | null = null;

export function loadDb(): DatabaseState {
  if (memoryState) return memoryState;

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseState;
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.projects)) {
        memoryState = parsed;
        return memoryState;
      }
    }
  } catch (err) {
    console.warn('Failed to load persisted DB file, re-seeding:', err);
  }

  memoryState = createSeedData();
  saveDb(memoryState);
  return memoryState;
}

export function saveDb(state: DatabaseState): void {
  memoryState = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist DB file:', err);
  }
}

export function resetDb(): DatabaseState {
  const fresh = createSeedData();
  saveDb(fresh);
  return fresh;
}
