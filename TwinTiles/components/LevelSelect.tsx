import React, { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { getLevelStars } from '../utils/progress';
import { StackScreenProps } from '@react-navigation/stack';
import { chapters } from '../data/chapters'; // Import your data

type RootStackParamList = {
  LevelSelect: { chapterId: number };
  Game: {
    levelId: number;
    chapterId: number;
    themeIndex?: number;
    forcedReset?: boolean;
  };
};

type Props = StackScreenProps<RootStackParamList, 'LevelSelect'>;

export default function LevelSelect({ navigation, route }: Props) {
  const chapterId = route.params?.chapterId ?? 0; // Chapters are usually 0-indexed in arrays
  const [levelData, setLevelData] = useState<{ [key: number]: number }>({});
  const isFocused = useIsFocused();

  // Get ACTUAL levels from your data file
  const currentChapter = chapters[chapterId];
  const actualLevels = currentChapter?.levels || [];

  const loadStars = async () => {
    const data: { [key: number]: number } = {};
    await Promise.all(
      actualLevels.map(async (lvl) => {
        const stars = await getLevelStars(chapterId, lvl.id);
        data[lvl.id] = stars || 0;
      })
    );
    setLevelData(data);
  };

  useEffect(() => {
    if (isFocused) loadStars();
  }, [isFocused, chapterId]);

  const renderLevel = ({ item: levelObj }: { item: typeof actualLevels[0] }) => {
    const levelId = levelObj.id;
    const stars = levelData[levelId] || 0;

    // Logic: Unlocked if it's level 1, or if the previous level has stars
    const currentIndex = actualLevels.findIndex(l => l.id === levelId);
    const isUnlocked = currentIndex === 0 || (levelData[actualLevels[currentIndex - 1].id] > 0);

    return (
      <TouchableOpacity
        style={[styles.levelCard, !isUnlocked && { opacity: 0.5 }]}
        disabled={!isUnlocked}
        onPress={() => navigation.navigate('Game', { levelId: levelId, chapterId })}
      >
        {isUnlocked ? (
          <>
            <Text style={styles.levelNumber}>{levelId}</Text>
            <View style={styles.starContainer}>
              {[1, 2, 3].map((s) => (
                <Text key={s} style={[styles.smallStar, { color: s <= stars ? '#fcc419' : '#dee2e6' }]}>★</Text>
              ))}
            </View>
          </>
        ) : (
          <Text style={{ fontSize: 20 }}>🔒</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{currentChapter?.title || 'Select Level'}</Text>
      <FlatList
        data={actualLevels}
        renderItem={renderLevel}
        keyExtractor={(item) => item.id.toString()}
        numColumns={4}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}
// ... styles stay the same

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center'
  },
  listContent: {
    paddingBottom: 40
  },
  levelCard: {
    width: 75,
    height: 90,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057'
  },
  starContainer: {
    flexDirection: 'row',
    marginTop: 5
  },
  smallStar: {
    fontSize: 14,
    marginHorizontal: 1
  },
});