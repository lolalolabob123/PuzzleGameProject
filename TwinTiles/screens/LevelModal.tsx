import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import LevelSelect from '../components/LevelSelect';
import { LevelModalProps } from '../navigation/types';
import { chapters } from '../data/chapters';
import { getLevelStars } from '../utils/progress';
import { useTheme } from '../context/ThemeContext';

// Extract the level item type directly from LevelSelect's props
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

    const enrichedLevels: LevelItem[] = await Promise.all(
      rawLevels.map(async (level) => {
        const starCount = await getLevelStars(chapterId, level.id);
        return { 
          id: level.id, 
          stars: starCount 
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
          levels={levelsWithProgress}
          onSelectLevel={(level) => {
            navigation.navigate("Game", {
              levelId: level.id,
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