import AsyncStorage from "@react-native-async-storage/async-storage";
import {chapters} from '../data/chapters';

interface GameProgress {
  [ChapterKey: string]: number;
}

const KEYS = {
  PROGRESS: "GAME_PROGRESS",
  levelState: (chapter: number, level: number) => `level_state_${chapter}_${level}`,
  stars: (chapter: number, level: number) => `stars_${chapter}_${level}`,
  prefixes: [
    "chapter_",
    "level_state_",
    "stars_",
    "GAME_PROGRESS",
    "FREE_HINTS_REMAINING",
    "HINT_COOLDOWNS",
    "STREAK_LAST_LOGIN",
    "STREAK_COUNT",
    "DAILY_LAST_SOLVED",
    "DAILY_TOTAL_SOLVED",
  ],
};

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

const getParsed = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw): defaultValue;
  } catch {
    return defaultValue;
  }
};

export const unlockNextLevel = async (chapterId: number, completedLevel: number) => {
  try {
    const progress = await getParsed<GameProgress>(KEYS.PROGRESS, {});
    const chapterKey = `chapter_${chapterId}`;
    const currentUnlocked = progress[chapterKey] || 1;

    if (completedLevel >= currentUnlocked) {
      progress[chapterKey] = completedLevel + 1;
      await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
    }
  } catch (error) {
    console.error("Error unlocking level:", error);
  }
};

export const getLevelStars = async (chapterId: number, level: number): Promise<number> => {
  try {
    const key = KEYS.stars(chapterId, level);
    const stars = await AsyncStorage.getItem(key);
    return stars ? parseInt(stars, 10): 0;
  } catch {
    return 0;
  }
};

/**
 * Fetches ALL level stars in a single multiGet call to eliminate storage waterfalls.
 * Returns map keyed by `${chapterId}_${levelId}` -> starCount.
 */
export const getAllLevelStars = async (): Promise<Record<string, number>> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const starKeys = allKeys.filter((key) => key.startsWith("stars_"));

    if (starKeys.length === 0) return {};

    const keyValues = await AsyncStorage.multiGet(starKeys);
    const result: Record<string, number> ={};

    for (const [key, value] of keyValues) {
      if (value !== null) {
        // e.g., "stars_1_2" -> keyParts: ["stars", "1", "2"]
        const parts = key.split("_");
        if (parts.length === 3) {
          const formattedKey = `${parts[1]}_${parts[2]}}`;
          result[formattedKey] = parseInt(value, 10) || 0;
        }
      }
    }
    return result
  } catch (e) {
    console.error("Failed to batch get all level stars:", e);
    return {};
  }
};

export const getChapterProgress = async (chapterId: number) => {
  const levelList = chapters[chapterId]?.levels ?? [];
  const total = levelList.length;
  if (total === 0) return {solved: 0, total: 0, totalStars: 0, maxStars: 0};

  // Fetch stars for all levels in this chapter currently
  const starCounts = await Promise.all(
    levelList.map((lvl) => getLevelStars(chapterId, lvl.id))
  );

  let solved = 0;
  let totalStars = 0;

  for (const s of starCounts) {
    if (s > 0) solved++;
    totalStars += s;
  }

  return {solved, total, totalStars, maxStars: total * 3};
};

export const saveLevelState = async (chapterId: number, levelId: number, state: number[]) => {
  try {
    const key = KEYS.levelState(chapterId, levelId);
    await AsyncStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save level state", e);
  }
};

export const getLevelState = async (chapterId: number, levelId: number) => {
  return await getParsed<number[] | null>(KEYS.levelState(chapterId, levelId), null);
};

export const saveLevelStars = async (chapterId: number, level: number, stars: number) => {
  try {
    const key = KEYS.stars(chapterId, level);
    const existingStars = await AsyncStorage.getItem(key);
    const bestStars = existingStars ? parseInt(existingStars, 10) : 0;

    if (stars > bestStars) {
      await AsyncStorage.setItem(key, stars.toString());
    }
  } catch (e) {
    console.error("Failed to save stars", e);
  }
};