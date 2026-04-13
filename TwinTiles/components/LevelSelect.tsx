import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';

type LevelItem = {
  id: number;
  stars?: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const SCREEN_PADDING = 20;
const COLUMN_GAP = 15;

const availableWidth =
  SCREEN_WIDTH -
  SCREEN_PADDING * 2 -
  COLUMN_GAP * (NUM_COLUMNS - 1);

const ITEM_SIZE = Math.floor(availableWidth / NUM_COLUMNS);

const LevelButton = ({ item, onPress }: {
  item: LevelItem;
  onPress: (level: LevelItem) => void;
}) => {
  console.log(`LevelButton ${item.id} → stars prop:`, item.stars);
  const stars = Number(item.stars ?? 0);
  console.log(`LevelButton ${item.id} → stars after Number():`, stars);

  const displayNum = item.id ?? "?";

  return (
    <TouchableOpacity
      style={[styles.levelButton, { width: ITEM_SIZE, height: ITEM_SIZE }]}
      onPress={() => onPress(item)}
    >
      <Text style={styles.levelText}>{displayNum}</Text>
      <View style={styles.starRow}>
        {[1, 2, 3].map((s) => (
          <Text
            key={s}
            style={[
              styles.starIcon,
              { color: s <= stars ? "#fcc419" : "#dee2e6" }
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

export default function LevelSelect({
  levels,
  onSelectLevel
}: {
  levels: LevelItem[];
  onSelectLevel: (level: LevelItem) => void;
}) {
  if (levels === undefined) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#228be6" />
        <Text style={styles.emptyText}>Loading Levels...</Text>
      </View>
    );
  }

  if (levels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No levels available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={levels}
        extraData={levels}
        renderItem={({ item }) => (
          <LevelButton item={item} onPress={onSelectLevel} />
        )}
        keyExtractor={(item) => `level-${item.id}-${item.stars ?? 0}`}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, color: '#868e96', fontSize: 16 },
  listContent: { paddingHorizontal: SCREEN_PADDING, paddingTop: 20, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'flex-start', gap: COLUMN_GAP, marginBottom: COLUMN_GAP },
  levelButton: {
    backgroundColor: '#f1f3f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  levelText: { fontSize: 18, fontWeight: 'bold', color: '#495057' },
  starRow: { flexDirection: 'row', marginTop: 4, gap: 2 },
  starIcon: { fontSize: 10 }
});