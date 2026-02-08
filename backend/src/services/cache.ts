import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.resolve(__dirname, "../../.cache");

// In-memory cache (fast lookup)
const memoryCache = new Map<string, unknown>();

/**
 * Generates a short hash from paper text to use as cache key.
 * Uses the first 10K chars to keep hashing fast while still being unique.
 */
function getCacheKey(paperText: string): string {
  const sample = paperText.substring(0, 10000);
  return crypto.createHash("md5").update(sample).digest("hex");
}

/**
 * Ensures the .cache directory exists.
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Gets a cached result for the given paper text.
 * Checks memory first, then disk.
 */
export function getCache<T>(paperText: string): T | null {
  const key = getCacheKey(paperText);

  // 1. Check memory cache
  if (memoryCache.has(key)) {
    console.log(`[Cache] HIT (memory) — key: ${key.substring(0, 8)}...`);
    return memoryCache.get(key) as T;
  }

  // 2. Check disk cache
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      // Load into memory for next time
      memoryCache.set(key, data);
      console.log(`[Cache] HIT (disk) — key: ${key.substring(0, 8)}...`);
      return data as T;
    } catch {
      // Corrupted cache file — ignore
    }
  }

  console.log(`[Cache] MISS — key: ${key.substring(0, 8)}...`);
  return null;
}

/**
 * Saves a result to both memory and disk cache.
 */
export function setCache<T>(paperText: string, data: T): void {
  const key = getCacheKey(paperText);

  // Save to memory
  memoryCache.set(key, data);

  // Save to disk (so it survives server restarts)
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");

  console.log(`[Cache] SAVED — key: ${key.substring(0, 8)}...`);
}
