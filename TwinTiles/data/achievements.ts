import { getChapterProgress, getLevelStars } from "../utils/progress";
import { chapters } from "./chapters";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  iconName: string;
  reward: number;
  isEarned: () => Promise<boolean>;
};

const countLevelsWithStars = async (minStars: number): Promise<number> => {
  let count = 0;
  for (const chapterIdStr of Object.keys(chapters)) {
    const chapterId = Number(chapterIdStr);
    for (const lvl of chapters[chapterId].levels) {
      const stars = await getLevelStars(chapterId, lvl.id);
      if (stars >= minStars) count++;
    }
  }
  return count;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-step",
    title: "First Steps",
    description: "Complete your first level.",
    iconName: "flag",
    reward: 25,
    isEarned: async () => (await countLevelsWithStars(1)) >= 1,
  },
  {
    id: "triple-three",
    title: "Triple Threat",
    description: "Earn 3 stars on 3 levels.",
    iconName: "star",
    reward: 75,
    isEarned: async () => (await countLevelsWithStars(3)) >= 3,
  },
  {
    id: "dedicated",
    title: "Dedicated Solver",
    description: "Complete 10 levels.",
    iconName: "trophy",
    reward: 100,
    isEarned: async () => (await countLevelsWithStars(1)) >= 10,
  },
  {
    id: "chapter-1",
    title: "Chapter One",
    description: "Complete every level in Chapter 1.",
    iconName: "bookmark",
    reward: 150,
    isEarned: async () => {
      const { solved, total } = await getChapterProgress(1);
      return total > 0 && solved >= total;
    },
  },
  {
    id: "chapter-1-perfect",
    title: "Chapter One Master",
    description: "Earn 3 stars on every level in Chapter 1.",
    iconName: "diamond",
    reward: 300,
    isEarned: async () => {
      const { totalStars, maxStars } = await getChapterProgress(1);
      return maxStars > 0 && totalStars >= maxStars;
    },
  },
  {
    id: "all-chapters",
    title: "Completionist",
    description: "Complete every chapter.",
    iconName: "crown",
    reward: 500,
    isEarned: async () => {
      for (const id of [1, 2, 3, 4]) {
        const { solved, total } = await getChapterProgress(id);
        if (total === 0 || solved < total) return false;
      }
      return true;
    },
  },
];