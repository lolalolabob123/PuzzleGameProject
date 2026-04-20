import { getFullSolution } from "../utils/levelGenerator";

const LINK_COLORS = ['rgba(34, 139, 230, 0.25)', 'rgba(250, 82, 82, 0.25)', 'rgba(64, 192, 87, 0.25)'];

const isLineLegal = (line: number[], size: number): boolean => {
  for (let j = 0; j < line.length - 2; j++) {
    if (line[j] > 0 && line[j] === line[j+1] && line[j] === line[j+2]) return false;
  }

  const voids = line.filter(c => c === -1).length;
  const playable = size - voids;
  const max = Math.ceil(playable / 2); 
  
  const c1 = line.filter(c => c === 1).length;
  const c2 = line.filter(c => c === 2).length;
  
  if (c1 > max || c2 > max) return false;
  return true;
};

const isGridLegal = (grid: number[], size: number): boolean => {
  for (let i = 0; i < size; i++) {
    const row = grid.slice(i * size, (i + 1) * size);
    const col = Array.from({ length: size }).map((_, r) => grid[r * size + i]);
    if (!isLineLegal(row, size) || !isLineLegal(col, size)) return false;
  }
  return true;
};

const generateChapterLevels = (chapterId: number): any[] => {
  const totalLevels = 10 + (chapterId - 1) * 5;

  return Array.from({ length: totalLevels }, (_, i) => {
    const levelId = i + 1;
    let size = (chapterId === 1 && levelId <= 10) ? 4 : (chapterId >= 4 && levelId > 15 ? 8 : 6);

    let finalGrid: number[] = [];
    let solution = getFullSolution(chapterId, levelId, size);
    let attempts = 0;

    while (attempts < 200) {
      let candidate = new Array(size * size).fill(0);
      const density = size === 4 ? 0.4 : 0.28; // Slightly higher density for 6x6/8x8
      const hintQuota = Math.floor(size * size * density);
      const revealedIndices = new Set<number>();

      // LOGICAL START: Reveal a pair of identical adjacent tiles from the solution
      for (let j = 0; j < size * size - 1; j++) {
        if (solution[j] === solution[j+1] && solution[j] > 0 && Math.random() > 0.7) {
          revealedIndices.add(j);
          revealedIndices.add(j+1);
          if (revealedIndices.size >= 4) break;
        }
      }

      // Fill remaining quota randomly
      while (revealedIndices.size < hintQuota) {
        revealedIndices.add(Math.floor(Math.random() * (size * size)));
      }

      revealedIndices.forEach(idx => {
        candidate[idx] = solution[idx];
      });

      if (chapterId === 3) {
        const numVoids = levelId > 10 ? 2 : 1;
        let voidsPlaced = 0;
        const availableForVoids = Array.from({ length: size * size }, (_, k) => k)
          .filter(idx => !revealedIndices.has(idx));

        for (let v = 0; v < numVoids && availableForVoids.length > 0; v++) {
          const randIdx = Math.floor(Math.random() * availableForVoids.length);
          const pos = availableForVoids.splice(randIdx, 1)[0];
          candidate[pos] = -1;
          if (!isGridLegal(candidate, size)) {
            candidate[pos] = 0; 
          } else {
            voidsPlaced++;
          }
        }
        if (voidsPlaced < numVoids) { attempts++; continue; }
      }

      if (isGridLegal(candidate, size)) {
        finalGrid = candidate;
        break;
      }
      attempts++;
    }

    if (finalGrid.length === 0) {
       finalGrid = solution.map((val, idx) => (idx % 7 === 0 ? val : 0));
    }

    let links = [];
    if (chapterId === 2) {
      const empties = finalGrid.map((v, idx) => v === 0 ? idx : -1).filter(idx => idx !== -1);
      if (empties.length >= 2) {
        const first = empties[Math.floor(Math.random() * empties.length)];
        const second = empties.find(idx => idx !== first && solution[idx] === solution[first]);
        if (second !== undefined) {
          links.push({ indices: [first, second], color: LINK_COLORS[0] });
        }
      }
    }

    return { id: levelId, size, grid: finalGrid, links: links.length > 0 ? links : undefined };
  });
};

export const chapters: Record<number, any> = {
  1: { title: "Chapter 1: The Basics", levels: generateChapterLevels(1) },
  2: { title: "Chapter 2: Multi-Links", levels: generateChapterLevels(2) },
  3: { title: "Chapter 3: The Abyss", levels: generateChapterLevels(3) },
  4: { title: "Chapter 4: The Master", levels: generateChapterLevels(4) }
};