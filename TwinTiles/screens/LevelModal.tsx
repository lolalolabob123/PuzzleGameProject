import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from "react-native";
import LevelSelect from '../components/LevelSelect';
import { chapters } from '../data/chapters';
import { getLevelStars } from '../utils/progress';

export default function LevelModalScreen({ route, navigation }: any) {
  const { chapterId, themeIndex } = route.params;
  const [levelsWithProgress, setLevelsWithProgress] = useState<any[]>([]);
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
    console.log("levelsWithProgress:", JSON.stringify(enrichedLevels.map(l => ({ id: l.id, stars: l.stars }))));
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
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#4dabf7" />
      ) : (
        <LevelSelect
          levels={levelsWithProgress}
          onSelectLevel={(level: any) => {
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