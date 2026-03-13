import React from 'react';
import { GameScreenProps } from "../navigation/types";
import PuzzleBoard from "../components/PuzzleBoard";
import { chapters } from "../data/chapters";

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const { levelId, chapterId, forcedReset } = route.params;

  const currentChapter = chapters[chapterId];
  const levelData = currentChapter?.levels.find(l => l.id === levelId);

  const handleNextLevel = () => {
    if (!currentChapter) return;

    const currentIndex = currentChapter.levels.findIndex(l => l.id === levelId);
    const nextLevel = currentChapter.levels[currentIndex + 1];

    if (nextLevel) {
      // Use replace to ensure the stack doesn't grow infinitely
      navigation.replace("Game", { 
        levelId: nextLevel.id, 
        chapterId: chapterId,
        forcedReset: false,
      });
    } else {
      navigation.goBack();
    }
  };

  if (!levelData) return null;

  return (
<PuzzleBoard 
  key={`chapter-${chapterId}-level-${levelId}`}
  level={levelId}
  chapterId={chapterId}
  levelData={levelData.grid}
  size={Math.sqrt(levelData.grid.length)}
  onNextLevel={handleNextLevel}
  forcedReset={forcedReset} // Change 'forcedreset' to 'forcedReset'
/>
  );
}