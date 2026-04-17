import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GameScreenProps } from "../navigation/types";
import PuzzleBoard from "../components/PuzzleBoard";
import { chapters } from "../data/chapters";
import { AVAILABLE_THEMES } from "../constants/themes";

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const { levelId, chapterId, forcedReset, themeIndex } = route.params;

  // --- 1. DATA LOOKUP ---
  const levelData = useMemo(() => {
    const chapter = chapters[chapterId];
    return chapter?.levels.find((l) => l.id === levelId);
  }, [chapterId, levelId]);

  const activeTheme = AVAILABLE_THEMES[themeIndex ?? 0];

  // --- 2. NAVIGATION HANDLERS ---
  const handleNextLevel = () => {
    const currentChapter = chapters[chapterId];
    if (!currentChapter) return;

    const currentIndex = currentChapter.levels.findIndex((l) => l.id === levelId);
    const nextLevel = currentChapter.levels[currentIndex + 1];

    if (nextLevel) {
      navigation.replace("Game", {
        levelId: nextLevel.id,
        chapterId,
        forcedReset: false,
        themeIndex: themeIndex ?? 0
      });
    } else {
      navigation.goBack();
    }
  };

  // --- 3. RENDER LOGIC ---
  if (!levelData) {
    return <ErrorState levelId={levelId} onBack={() => navigation.goBack()} />;
  }

  return (
    <View style={styles.container}>
<PuzzleBoard
  key={`board-${chapterId}-${levelId}`} 
  levelData={levelData}
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

// --- 4. SUB-COMPONENTS ---

const ErrorState = ({ levelId, onBack }: { levelId: number; onBack: () => void }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>Level {levelId} not found!</Text>
    <Text style={styles.errorSubtext}>
      This level might not be added to your chapters data yet.
    </Text>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Text style={styles.backButtonText}>Go Back</Text>
    </TouchableOpacity>
  </View>
);

// --- STYLES ---
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4dabf7',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});