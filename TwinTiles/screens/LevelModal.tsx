import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from "react-native";
import LevelSelect from '../components/LevelSelect';
import { LevelModalProps } from '../navigation/types';
import { chapters, Level } from '../data/chapters';
import { getLevelStars } from '../utils/progress';
import { useTheme } from '../context/ThemeContext';

export default function LevelModalScreen({ route, navigation }: LevelModalProps) {
  const {ui: uiTheme} = useTheme()
  const { chapterId, themeIndex } = route.params;
  const [levelsWithProgress, setLevelsWithProgress] = useState<(Level & {stars: number})[]>([])
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const rawLevels = chapters[chapterId]?.levels || [];
    const enrichedLevels = await Promise.all(
      rawLevels.map(async (level) => {
        const starCount = await getLevelStars(chapterId, level.id);
        return { ...level, stars: starCount };
      })
    );
    setLevelsWithProgress([...enrichedLevels]);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, chapterId]);

  useEffect(() => {
    loadData();
  }, [chapterId]);

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={uiTheme.primary} />
      ) : (
        <LevelSelect
          levels={levelsWithProgress}
          onSelectLevel={(level) => {
            navigation.navigate("Game", {
              levelId: level.id,
              chapterId: chapterId,
              themeIndex: themeIndex
            });
          }}
        />
      )}
    </View>
  );
}