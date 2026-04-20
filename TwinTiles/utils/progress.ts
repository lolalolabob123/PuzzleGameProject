import AsyncStorage from "@react-native-async-storage/async-storage";

interface GameProgress {
  [ChapterKey: string]: number
}

const KEYS = {
  PROGRESS: "GAME_PROGRESS",
  levelState: (chapter: number, level: number) => `level_state_${chapter}_${level}`,
  stars: (chapter: number, level: number) => `stars_${chapter}_${level}`,
  prefixes: ["chapter_", "level_state_", "stars_", "GAME_PROGRESS"]
}

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

const getParsed = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

export const unlockNextLevel = async (chapterId: number, completedLevel: number) => {
  try {
    const progress = await getParsed<GameProgress>(KEYS.PROGRESS, {})
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

export const getChapterProgress = async (chapterId: number): Promise<number> => {
  const progress = await getParsed<GameProgress>(KEYS.PROGRESS, {})
  return progress[`chapter_${chapterId}`] || 1;
};

export const saveLevelState = async (chapterId: number, levelId: number, state: number[]) => {
  try {
    const key = KEYS.levelState(chapterId, levelId)
    await AsyncStorage.setItem(key, JSON.stringify(state))
  } catch (e) {
    console.error("Failed to save level state", e)
  }
};

export const getLevelState = async (chapterId: number, levelId: number) => {
  return await getParsed<number[] | null>(KEYS.levelState(chapterId, levelId), null)
};

export const resetChapterProgress = async (chapterId: number) => {
  try {
    const progress = await getParsed<GameProgress>(KEYS.PROGRESS, {});
    progress[`chapter_${chapterId}`] = 1;
    await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));

    const allKeys = await AsyncStorage.getAllKeys();


    const keysToRemove = allKeys.filter(key =>
      key.startsWith(`level_state_${chapterId}_`) ||
      key.startsWith(`stars_${chapterId}_`)
    );

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }

    await wait(50);
  } catch (e) {
    console.error("Failed to reset chapter", e);
    throw e;
  }
};

export const clearAllGameData = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();

    const gameKeys = allKeys.filter(key =>
      KEYS.prefixes.some(prefix => key.startsWith(prefix))
    );

    if (gameKeys.length > 0) {
      await AsyncStorage.multiRemove(gameKeys);
    }

    await wait(50);

  } catch (e) {
    console.error("Failed to clear all game data", e);
  }
};

export const saveLevelStars = async (chapterId: number, level: number, stars: number) => {
  try {
    const key = `stars_${chapterId}_${level}`; 
    const existingStars = await AsyncStorage.getItem(key);
    const bestStars = existingStars ? parseInt(existingStars, 10) : 0;

    if (stars > bestStars) {
      await AsyncStorage.setItem(key, stars.toString());
    }
  } catch(e) {
    console.error("Failed to save stars", e);
  }
};

export const getLevelStars = async (chapterId: number, level: number): Promise<number> => {
  const key = `stars_${chapterId}_${level}`; 
  const stars = await AsyncStorage.getItem(key);

  const parsed = stars ? parseInt(stars, 10) : 0;

  return parsed;
};