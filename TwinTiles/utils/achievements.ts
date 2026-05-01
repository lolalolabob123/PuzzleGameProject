import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACHIEVEMENTS, Achievement } from "../data/achievements";
import { addCoins } from "./coins";

const KEY = "EARNED_ACHIEVEMENTS";

const getEarnedIds = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setEarnedIds = async (ids: string[]) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(ids));
};


export const getAchievementStatus = async (): Promise<Array<{achievement: Achievement; earned: boolean}>> => {
    const earnedIds = await getEarnedIds()
    return ACHIEVEMENTS.map(a => ({
        achievement: a,
        earned: earnedIds.includes(a.id),
    }))
}

export const checkAndGrantAchievements = async (): Promise<Achievement[]> => {
  const earnedIds = await getEarnedIds();
  const newlyEarned: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (earnedIds.includes(achievement.id)) continue;
    const isNow = await achievement.isEarned();
    if (isNow) {
      earnedIds.push(achievement.id);
      await addCoins(achievement.reward);
      newlyEarned.push(achievement);
    }
  }

  if (newlyEarned.length > 0) {
    await setEarnedIds(earnedIds);
  }

  return newlyEarned;
};