import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { getLevelStars } from '../utils/progress';
import { StackScreenProps } from '@react-navigation/stack';

type RootStackParamList = {
  LevelSelect: { chapterId: number };
  Game: { level: number; chapterId: number };
};

type Props = StackScreenProps<RootStackParamList, 'LevelSelect'>;

const LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function LevelSelect({ navigation, route }: Props) {
  const chapterId = route.params?.chapterId ?? 1;
  const [levelData, setLevelData] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const loadStars = async () => {
      const data: { [key: number]: number } = {};
      for (const level of LEVELS) {
        const stars = await getLevelStars(chapterId, level);
        data[level] = stars;
      }
      setLevelData(data);
    };
    loadStars();
  }, [chapterId]);

  const renderLevel = ({ item: level }: { item: number }) => {
    const stars = levelData[level] || 0;

    return (
      <TouchableOpacity
        style={styles.levelCard}
        onPress={() => navigation.navigate('Game', { level, chapterId })}
      >
        <Text style={styles.levelNumber}>{level}</Text>
        <View style={styles.starContainer}>
          {[1, 2, 3].map((s) => (
            <Text
              key={s}
              style={[styles.smallStar, { color: s <= stars ? '#fcc419' : '#dee2e6' }]}
            >
              ★
            </Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Level</Text>
      <FlatList
        data={LEVELS}
        renderItem={renderLevel}
        keyExtractor={(item) => item.toString()}
        numColumns={4}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#212529', marginBottom: 20, textAlign: 'center' },
  listContent: { paddingBottom: 40 },
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
  levelNumber: { fontSize: 24, fontWeight: 'bold', color: '#495057' },
  starContainer: { flexDirection: 'row', marginTop: 5 },
  smallStar: { fontSize: 14, marginHorizontal: 1 },
});