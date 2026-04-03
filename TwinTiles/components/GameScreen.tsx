import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GameScreenProps } from "../navigation/types";
import PuzzleBoard from "../components/PuzzleBoard";
import { chapters, Level } from "../data/chapters";
import { AVAILABLE_THEMES } from "../constants/themes";

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const { levelId, chapterId, forcedReset, themeIndex } = route.params;

  const currentChapter = chapters[chapterId];
  // Ensure we find the level by ID
  const levelData = currentChapter?.levels.find((l: Level) => l.id === levelId);

  const [activeTheme] = useState(AVAILABLE_THEMES[themeIndex ?? 0]);

  // ERROR BOUNDARY: If Level 11 doesn't exist in your data, show this instead of "null"
  if (!levelData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Level {levelId} not found!</Text>
        <Text style={styles.errorSubtext}>Check if Level {levelId} exists in your chapters data.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleNextLevel = () => {
    if (!currentChapter) return;

    const currentIndex = currentChapter.levels.findIndex((l: Level) => l.id === levelId);
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

  return (
    <View style={styles.container}>
      <PuzzleBoard
        key={`${chapterId}-${levelId}`} // Forces reset on level change
        levelData={levelData.grid}
        chapterId={chapterId}
        level={levelId}
        size={levelData.size}
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
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fa5252',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#868e96',
    textAlign: 'center',
    marginVertical: 10,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#4dabf7',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});