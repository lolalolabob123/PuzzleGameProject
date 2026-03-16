import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native'; // Added missing imports
import { GameScreenProps } from "../navigation/types";
import PuzzleBoard from "../components/PuzzleBoard";
import { chapters } from "../data/chapters";
import { AVAILABLE_THEMES } from "../constants/themes";

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const { levelId, chapterId, forcedReset, themeIndex } = route.params;

  const currentChapter = chapters[chapterId];
  const levelData = currentChapter?.levels.find(l => l.id === levelId);

  const [activeTheme] = useState(AVAILABLE_THEMES[themeIndex ?? 0])

  const handleNextLevel = () => {
    if (!currentChapter) return;

    const currentIndex = currentChapter.levels.findIndex(l => l.id === levelId);
    const nextLevel = currentChapter.levels[currentIndex + 1];

    if (nextLevel) {
      navigation.replace("Game", {
        levelId: nextLevel.id,
        chapterId: chapterId,
        forcedReset: false,
        themeIndex: themeIndex ?? 0
      });
    } else {
      navigation.goBack();
    }
  };

  // If levelData isn't found, don't try to render
  if (!levelData) return null;

return (
  <View style={styles.container}>
    <PuzzleBoard 
      // 1. We use levelData.grid because your type defines 'grid'
      levelData={levelData.grid} 
      chapterId={chapterId}
      level={levelId} 
      // 2. We calculate the square root of the array length (16 -> 4, 36 -> 6)
      size={Math.sqrt(levelData.grid.length)} 
      onNextLevel={handleNextLevel}
      forcedReset={forcedReset}
      theme={activeTheme} 
    />
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Or your theme background
  },
});