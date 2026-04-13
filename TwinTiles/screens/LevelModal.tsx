import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from "react-native";
import { useIsFocused } from '@react-navigation/native';
import LevelSelect from '../components/LevelSelect';
import { chapters } from '../data/chapters';
import { getLevelStars } from '../utils/progress';

export default function LevelModalScreen({ route, navigation }: any) {
  const { chapterId, themeIndex } = route.params;
  const [levelsWithProgress, setLevelsWithProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalTick, setInternalTick] = useState(0); // Force re-render trigger

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
    // This runs when the component mounts
    loadData();

    // This runs EVERY time you navigate to this screen, even if it's already open
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation, chapterId]);

  return (
    <View style={{ flex: 1 }} key={route.params?.refreshKey || 'static'}>
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#4dabf7" />
      ) : (
        <LevelSelect 
          key={`list-${chapterId}-${levelsWithProgress[0]?.stars}`} // Force list refresh
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