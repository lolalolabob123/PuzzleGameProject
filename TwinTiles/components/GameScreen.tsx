import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GameScreenProps } from "../navigation/types";
import PuzzleBoard from "../components/PuzzleBoard";
import { chapters } from "../data/chapters";
import { useTheme } from '../context/ThemeContext';
import {
  spacing,
  radii,
  typography,
  shadows,
  UITheme,
} from "../constants/uiTheme";

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const { levelId, chapterId, forcedReset, themeIndex } = route.params;

  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  const levelData = useMemo(() => {
    const chapter = chapters[chapterId];
    return chapter?.levels.find((l) => l.id === levelId);
  }, [chapterId, levelId]);

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
        themeIndex: themeIndex ?? 0,
      });
    } else {
      navigation.goBack();
    }
  };

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
      />
    </View>
  );
}

const ErrorState = ({
  levelId,
  onBack,
}: {
  levelId: number;
  onBack: () => void;
}) => {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  return (
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
};

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: uiTheme.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: uiTheme.background,
    },
    errorText: {
      ...typography.title,
      fontSize: 22,
      color: uiTheme.danger,
    },
    errorSubtext: {
      ...typography.body,
      color: uiTheme.textMuted,
      textAlign: 'center',
      marginVertical: spacing.sm + 2,
    },
    backButton: {
      marginTop: spacing.xl,
      paddingHorizontal: spacing.xxl - 8,
      paddingVertical: spacing.md,
      backgroundColor: uiTheme.primary,
      borderRadius: radii.md,
      ...shadows.sm,
    },
    backButtonText: {
      color: uiTheme.name === 'mono' ? uiTheme.surface : '#FFFFFF',
      fontWeight: 'bold',
    },
  });
