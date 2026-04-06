import React, { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import LevelSelect from '../components/LevelSelect';
import { chapters } from '../data/chapters';
import { getLevelStars } from '../utils/progress';

export default function LevelModalScreen({ route, navigation }: any) {
  const { chapterId } = route.params;
  const isFocused = useIsFocused();
  const [levelsWithProgress, setLevelsWithProgress] = useState<any[]>([]);

  useEffect(() => {
    const loadLevelData = async () => {
      const rawLevels = chapters[chapterId]?.levels || [];

      const enrichedLevels = await Promise.all(
        rawLevels.map(async (level) => {
          const stars = await getLevelStars(chapterId, level.id);
          return { ...level, stars: stars || 0 };
        })
      );
      
      setLevelsWithProgress(enrichedLevels);
    };

    if (isFocused) {
      loadLevelData();
    }
  }, [chapterId, isFocused]);

  return (
    <LevelSelect 
      levels={levelsWithProgress} 
      onSelectLevel={(level: any) => {
        navigation.navigate("Game", {
          levelId: level.id,
          chapterId: chapterId,
          size: level.size,
          levelData: level.grid
        });
      }} 
    />
  );
}