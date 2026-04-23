import { getFixedLevel, getFullSolution, getSeededVoids, getChapter4Level } from "../utils/levelGenerator";
import seedrandom from "seedrandom";  

const LINK_COLORS = [
  'rgba(34, 139, 230, 0.25)',
  'rgba(250, 82, 82, 0.25)',
  'rgba(64, 192, 87, 0.25)',
];

export interface Cage {
  indices: number[];
  target: number;
}

export interface Level {
  id: number;
  size: number;
  grid: number[];
  links?: { indices: number[], color: string }[];
  cages?: Cage[];
}

export interface Chapter {
  title: string;
  subtitle: string;
  icon: 'star' | 'link' | 'asterisk' | 'key';
  levels: Level[];
}

const generateChapterLevels = (chapterId: number): Level[] => {
  const totalLevels = 10 + (chapterId - 1) * 5

  return Array.from({length: totalLevels}, (_, i) => {
    const levelId = i + 1
    let size = (chapterId === 1 && levelId <= 10) ? 4 : 6
    if (chapterId === 4 && levelId > 15) size = 8

    const base = 0.35
    const perLevel = 0.015
    const perChapter = 0.04
    const difficulty = Math.min(0.65, base + i * perLevel + (chapterId - 1) * perChapter)

    if (chapterId === 4) {
      const {grid, cages} = getChapter4Level(levelId, size, difficulty)
      return {id: levelId, size, grid, cages}
    }

    const voids = chapterId === 3 ? getSeededVoids(levelId, size, levelId > 8 ? 2 : 1) : []
    const finalGrid = getFixedLevel(chapterId, levelId, size, difficulty, voids)

    let links: {indices: number[]; color: string}[] = []
    if (chapterId === 2) {
      const solution = getFullSolution(chapterId, levelId, size)
      const linkRng = seedrandom(`chapter2-links-${levelId}`)
      const empties = finalGrid
        .map((v, idx) => (v === 0 ? idx : -1))
        .filter((idx) => idx !== -1)
      const numLinks = levelId <= 5 ? 1 : levelId <= 12 ? 2 : 3

      for (let l = 0; l < numLinks; l++) {
        if (empties.length < 2) break
        const first = empties.splice(Math.floor(linkRng() * empties.length), 1)[0]
        const matchIdx = empties.findIndex((idx) => solution[idx] === solution[first])
        if (matchIdx !== -1) {
          const second  = empties.splice(matchIdx, 1)[0]
          links.push({indices: [first, second], color: LINK_COLORS[l % LINK_COLORS.length]})
        }
      }
    }
    return {id: levelId, size, grid: finalGrid, links: links.length > 0 ? links: undefined}
  })
}

export const chapters: Record<number, Chapter> = {
  1: {title: "The Basics", subtitle: "Learn the rules", icon: 'star', levels: generateChapterLevels(1)},
  2: {title: "Multi-Links", subtitle: "Linked tiles move together", icon: 'link', levels: generateChapterLevels(2)},
  3: {title: "The Void", subtitle: "Voids change the rules", icon: 'asterisk', levels: generateChapterLevels(3)},
  4: {title: "The Master", subtitle: "Cages add new constraints", icon: 'key', levels: generateChapterLevels(4)}
};