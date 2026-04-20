// chapters.ts
import { getFixedLevel, getFullSolution } from "../utils/levelGenerator";

export interface Level {
  id: number;
  size: number;
  grid: number[];
  links?: number[][];
}

export interface Chapter {
  title: string;
  levels: Level[];
}

const generateChapterLevels = (chapterId: number, totalLevels: number): Level[] => {
  return Array.from({ length: totalLevels }, (_, i) => {
    const levelId = i + 1;
    const size = levelId <= 5 ? 4 : 6;
    const difficulty = Math.min(0.4 + (i * 0.03), 0.7);

    let grid = getFixedLevel(chapterId, levelId, size, difficulty);

    const solution = getFullSolution(chapterId, levelId, size)

    let links: number[][] = [];

    // CHAPTER 2: Inject Links (e.g., link cells at index 0 and 1)
    if (chapterId === 2) {
      const emptyIndices = grid
        .map((v, index) => v === 0 ? index : -1)
        .filter(index => index !== -1);

      if (emptyIndices.length >= 2) {
        let first = emptyIndices[0]
        let second = -1

        for (let j = 1; j < emptyIndices.length; j++) {
          const indexB = emptyIndices[j]

          if (solution[first] === solution[indexB]) {
            const rowA = Math.floor(first / size)
            const colA = first % size
            const rowB = Math.floor(indexB / size)
            const colB = indexB % size
            const dist = Math.abs(rowA - rowB) + Math.abs(colA - colB)

            if (dist > 1) {
              second = indexB
              break
            }
          }
        }

        if (second !== -1) {
          links.push([first, second])
        }
      }
    }

    // CHAPTER 3: Inject Void Cells (-1)
    if (chapterId === 3) {
      const emptyIndices = grid.map((v, idx) => v === 0 ? idx : -1).filter(idx => idx !== -1);
      if (emptyIndices.length > 0) {
        grid[emptyIndices[0]] = -1;
      }
    }

    return {
      id: levelId,
      size: size,
      grid: grid,
      links: links.length > 0 ? links : undefined
    };
  });
};

export const chapters: Record<number, Chapter> = {
  1: { title: "Chapter 1: The Basics", levels: generateChapterLevels(1, 10) },
  2: { title: "Chapter 2: Linked Pairs", levels: generateChapterLevels(2, 10) },
  3: { title: "Chapter 3: The Abyss (Voids)", levels: generateChapterLevels(3, 10) },
  4: { title: "Chapter 4: The Master", levels: generateChapterLevels(4, 10) }
};