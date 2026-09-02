import AsyncStorage from "@react-native-async-storage/async-storage";
import { chapters } from "../data/chapters";

interface GameProgress {
  [ChapterKey: string]: number;
}

export interface ActiveSession {
  chapterId: number;
  levelId: number;
  grid: number[];
  moves: number;
}

const KEYS = {
  PROGRESS: "GAME_PROGRESS",
  ACTIVE_SESSION: "ACTIVE_SESSION",
  levelState: (chapter: number, level: number) => `level_state_${chapter}_${level}`,
  stars: (chapter: number, level: number) => `stars_${chapter}_${level}`,
  prefixes: [
    "chapter_",
    "level_state_",
    "stars_",
    "GAME_PROGRESS",
    "ACTIVE_SESSION",
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
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Returns the highest chapter ID the user has unlocked.
 */
export const getHighestUnlockedChapter = async (): Promise<number> => {
  try {
    const chapterIds = Object.keys(chapters).map(Number).sort((a, b) => a - b);
    if (chapterIds.length === 0) return 1;

    let highestUnlocked = chapterIds[0];

    for (let i = 1; i < chapterIds.length; i++) {
      const prevChapterId = chapterIds[i - 1];
      const currentChapterId = chapterIds[i];

      const prevProgress = await getChapterProgress(prevChapterId);
      
      if (prevProgress.total > 0 && prevProgress.solved >= prevProgress.total) {
        highestUnlocked = currentChapterId;
      } else {
        break;
      }
    }

    return highestUnlocked;
  } catch (error) {
    console.error("Error computing highest unlocked chapter:", error);
    return 1;
  }
};

/**
 * Gets the maximum level unlocked for a specific chapter.
 */
export const getUnlockedLevels = async (chapterId: number): Promise<number> => {
  try {
    const progress = await getParsed<GameProgress>(KEYS.PROGRESS, {});
    return progress[`chapter_${chapterId}`] || 1;
  } catch {
    return 1;
  }
};

/**
 * Unlocks the next level after solving `completedLevel`.
 */
export const unlockNextLevel = async (chapterId: number, completedLevel: number) => {
  try {
    const progress = await getParsed<GameProgress>(KEYS.PROGRESS, {});
    const chapterKey = `chapter_${chapterId}`;
    const currentUnlocked = progress[chapterKey] || 1;

    // Sets next unlocked level to completedLevel + 1
    const nextLevel = completedLevel + 1;
    if (nextLevel > currentUnlocked) {
      progress[chapterKey] = nextLevel;
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
    return stars ? parseInt(stars, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Fetches ALL level stars in a single multiGet call to eliminate storage waterfalls.
 */
export const getAllLevelStars = async (): Promise<Record<string, number>> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const starKeys = allKeys.filter((key) => key.startsWith("stars_"));

    if (starKeys.length === 0) return {};

    const keyValues = await AsyncStorage.multiGet(starKeys);
    const result: Record<string, number> = {};

    for (const [key, value] of keyValues) {
      if (value !== null) {
        const parts = key.split("_");
        if (parts.length === 3) {
          const formattedKey = `${parts[1]}_${parts[2]}`;
          result[formattedKey] = parseInt(value, 10) || 0;
        }
      }
    }
    return result;
  } catch (e) {
    console.error("Failed to batch get all level stars:", e);
    return {};
  }
};

export const getChapterProgress = async (chapterId: number) => {
  const levelList = chapters[chapterId]?.levels ?? [];
  const total = levelList.length;
  if (total === 0) return { solved: 0, total: 0, totalStars: 0, maxStars: 0 };

  const starCounts = await Promise.all(
    levelList.map((lvl) => getLevelStars(chapterId, lvl.id))
  );

  let solved = 0;
  let totalStars = 0;

  for (const s of starCounts) {
    if (s > 0) solved++;
    totalStars += s;
  }

  return { solved, total, totalStars, maxStars: total * 3 };
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

export const resetChapterProgress = async (chapterId: number) => {
  try {
    const progress = await getParsed<GameProgress>(KEYS.PROGRESS, {});
    progress[`chapter_${chapterId}`] = 1;
    await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));

    const allKeys = await AsyncStorage.getAllKeys();

    const keysToRemove = allKeys.filter(
      (key) =>
        key.startsWith(`level_state_${chapterId}_`) ||
        key.startsWith(`stars_${chapterId}_`)
    );
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }

    await AsyncStorage.removeItem(KEYS.ACTIVE_SESSION);
    await wait(50);
  } catch (e) {
    console.error("Failed to reset chapter", e);
    throw e;
  }
};

export const clearAllGameData = async () => {
  try {
    const allkeys = await AsyncStorage.getAllKeys();

    const gameKeys = allkeys.filter((key) =>
      KEYS.prefixes.some((prefix) => key.startsWith(prefix))
    );

    if (gameKeys.length > 0) {
      await AsyncStorage.multiRemove(gameKeys);
    }

    await wait(50);
  } catch (e) {
    console.error("Failed to clear all game data", e);
  }
};

/**
 * Saves mid-puzzle progress so the player can resume later.
 */
export const saveActiveSession = async (session: ActiveSession) => {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(session));
    await saveLevelState(session.chapterId, session.levelId, session.grid);
  } catch (e) {
    console.error("Failed to save active session", e);
  }
};

/**
 * Retrieves the last played session for resuming.
 */
export const getActiveSession = async (): Promise<ActiveSession | null> => {
  try {
    const session = await getParsed<ActiveSession | null>(KEYS.ACTIVE_SESSION, null);
    if (
      session &&
      typeof session.chapterId === "number" &&
      typeof session.levelId === "number" &&
      Array.isArray(session.grid)
    ) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Clears saved level state once a level is won or manually reset.
 */
export const clearActiveSession = async (chapterId?: number, levelId?: number) => {
  try {
    await AsyncStorage.removeItem(KEYS.ACTIVE_SESSION);
    if (chapterId !== undefined && levelId !== undefined) {
      await AsyncStorage.removeItem(KEYS.levelState(chapterId, levelId));
    }
  } catch (e) {
    console.error("Failed to clear active session", e);
  }
};