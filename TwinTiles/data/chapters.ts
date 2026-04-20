// chapters.ts
import { getFullSolution } from "../utils/levelGenerator";

const LINK_COLORS = [
  'rgba(34, 139, 230, 0.25)', // Blue
  'rgba(250, 82, 82, 0.25)',  // Red
  'rgba(64, 192, 87, 0.25)',  // Green
];

export interface Level {
  id: number;
  size: number;
  grid: number[];
  links?: { indices: number[], color: string }[]; 
}

/**
 * Ensures the generated candidate grid follows the basic rules 
 * (No triples, balanced counts).
 */
const isGridLegal = (grid: number[], size: number): boolean => {
  for (let i = 0; i < size; i++) {
    const row = grid.slice(i * size, (i + 1) * size);
    const col = Array.from({ length: size }).map((_, r) => grid[r * size + i]);
    
    // Triple check
    const hasTriple = (line: number[]) => {
      for (let j = 0; j < line.length - 2; j++) {
        if (line[j] > 0 && line[j] === line[j+1] && line[j] === line[j+2]) return true;
      }
      return false;
    };

    if (hasTriple(row) || hasTriple(col)) return false;

    // Count check (Ceiling limit)
    const max = Math.ceil(size / 2);
    if (row.filter(c => c === 1).length > max || row.filter(c => c === 2).length > max) return false;
    if (col.filter(c => c === 1).length > max || col.filter(c => c === 2).length > max) return false;
  }
  return true;
};

const generateChapterLevels = (chapterId: number): Level[] => {
  const totalLevels = 10 + (chapterId - 1) * 5;

  return Array.from({ length: totalLevels }, (_, i) => {
    const levelId = i + 1;
    let size = (chapterId === 1 && levelId <= 10) ? 4 : 6;
    if (chapterId === 4 && levelId > 15) size = 8;

    let solution = getFullSolution(chapterId, levelId, size);
    let finalGrid: number[] = [];
    let attempts = 0;

    // We loop to ensure we find a "fair" starting point
    while (attempts < 100) {
      let candidate = new Array(size * size).fill(0);
      const revealed = new Set<number>();
      // Density scales slightly with level
      const targetHints = Math.floor(size * size * (0.3 + (i * 0.01)));

      // 1. SEED LOGICAL ANCHORS (Pairs and Gaps)
      for (let j = 0; j < size * size; j++) {
        const r = Math.floor(j / size);
        const c = j % size;

        // Horizontal Pair (XX -> OXXO)
        if (c < size - 1 && solution[j] === solution[j+1] && Math.random() > 0.6) {
          revealed.add(j); revealed.add(j+1);
        }
        // Vertical Pair
        if (r < size - 1 && solution[j] === solution[j+size] && Math.random() > 0.6) {
          revealed.add(j); revealed.add(j+size);
        }
        // Gaps (X_X -> XOX)
        if (c < size - 2 && solution[j] === solution[j+2] && Math.random() > 0.7) {
          revealed.add(j); revealed.add(j+2);
        }
        
        if (revealed.size >= targetHints) break;
      }

      revealed.forEach(idx => { candidate[idx] = solution[idx]; });

      if (isGridLegal(candidate, size)) {
        finalGrid = candidate;
        break;
      }
      attempts++;
    }

    // Fallback if logic fails
    if (finalGrid.length === 0) finalGrid = solution.map((v, idx) => idx % 4 === 0 ? v : 0);

    // 2. APPLY VOIDS (Chapter 3)
    if (chapterId === 3) {
      const numVoids = levelId > 8 ? 2 : 1;
      let placed = 0;
      const empties = finalGrid.map((v, idx) => v === 0 ? idx : -1).filter(idx => idx !== -1);
      for (let v = 0; v < numVoids && empties.length > 0; v++) {
        const idx = empties.splice(Math.floor(Math.random() * empties.length), 1)[0];
        finalGrid[idx] = -1;
        placed++;
      }
    }

    // 3. APPLY LINKS (Chapter 2)
    let links: { indices: number[], color: string }[] = [];
    if (chapterId === 2) {
      const empties = finalGrid.map((v, idx) => v === 0 ? idx : -1).filter(idx => idx !== -1);
      const numLinks = levelId <= 5 ? 1 : (levelId <= 12 ? 2 : 3);
      for (let l = 0; l < numLinks; l++) {
        if (empties.length < 2) break;
        const first = empties.splice(Math.floor(Math.random() * empties.length), 1)[0];
        const matchIdx = empties.findIndex(idx => solution[idx] === solution[first]);
        if (matchIdx !== -1) {
          const second = empties.splice(matchIdx, 1)[0];
          links.push({ indices: [first, second], color: LINK_COLORS[l % LINK_COLORS.length] });
        }
      }
    }

    return { id: levelId, size, grid: finalGrid, links: links.length > 0 ? links : undefined };
  });
};

export const chapters: Record<number, Chapter> = {
  1: { title: "Chapter 1: The Basics", levels: generateChapterLevels(1) },
  2: { title: "Chapter 2: Multi-Links", levels: generateChapterLevels(2) },
  3: { title: "Chapter 3: The Abyss", levels: generateChapterLevels(3) },
  4: { title: "Chapter 4: The Master", levels: generateChapterLevels(4) }
};