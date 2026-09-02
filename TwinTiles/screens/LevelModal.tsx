import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import LevelSelect from '../components/LevelSelect';
import { LevelModalProps } from '../navigation/types';
import { chapters } from '../data/chapters';
import { getLevelStars, getUnlockedLevels } from '../utils/progress';
import { useTheme } from '../context/ThemeContext';

type LevelItem = React.ComponentProps<typeof LevelSelect>['levels'][number];

export default function LevelModalScreen({ route, navigation }: LevelModalProps) {
  const { ui: uiTheme } = useTheme();
  const { chapterId, themeIndex } = route.params;
  const [levelsWithProgress, setLevelsWithProgress] = useState<LevelItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    const chapter = chapters[chapterId];
    const rawLevels = chapter?.levels || [];

    // Fetch list of unlocked level IDs and normalize to an array
    const rawUnlocked = await getUnlockedLevels(chapterId);
    const unlockedIds: number[] = Array.isArray(rawUnlocked)
      ? rawUnlocked
      : typeof rawUnlocked === 'number'
      ? [rawUnlocked]
      : [];

    const unlockedSet = new Set<number>(unlockedIds.length > 0 ? unlockedIds : [1]);

    const enrichedLevels: LevelItem[] = await Promise.all(
      rawLevels.map(async (level, index) => {
        const starCount = await getLevelStars(chapterId, level.id);

        const isUnlocked =
          index === 0 ||
          level.id === 1 ||
          unlockedSet.has(level.id);

        return {
          ...level,
          id: level.id,
          stars: starCount,
          unlocked: isUnlocked,
          isUnlocked: isUnlocked,
        } as LevelItem;
      })
    );

    setLevelsWithProgress(enrichedLevels);
    setLoading(false);
  }, [chapterId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  return (
    <View style={[styles.container, { backgroundColor: uiTheme.background }]}>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={uiTheme.primary} />
      ) : (
        <LevelSelect
          chapterId={chapterId}
          levels={levelsWithProgress}
          onSelectLevel={(level: any) => {
            const selectedId = typeof level === 'number' ? level : level?.id;
            navigation.navigate("Game", {
              levelId: selectedId,
              chapterId: chapterId,
              themeIndex: themeIndex,
            });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
  },
});