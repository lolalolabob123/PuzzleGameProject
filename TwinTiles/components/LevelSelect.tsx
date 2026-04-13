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

// --------------------
// Types
// --------------------
type LevelItem = {
  id: number;
  stars?: number;
};

// --------------------
// Layout constants
// --------------------
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const SCREEN_PADDING = 20;
const COLUMN_GAP = 15;

const availableWidth =
  SCREEN_WIDTH -
  SCREEN_PADDING * 2 -
  COLUMN_GAP * (NUM_COLUMNS - 1);

const ITEM_SIZE = Math.floor(availableWidth / NUM_COLUMNS);

// --------------------
// Level Button
// --------------------
const LevelButton = ({
  item,
  onPress
}: {
  item: LevelItem;
  onPress: (level: LevelItem) => void;
}) => {
  const displayNum = item.id ?? "?";

  // ✅ safe + consistent
  const stars = Number(item.stars ?? 0);

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
            ⭐
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// --------------------
// Main Component
// --------------------
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

        // ✅ Forces full refresh when stars change
        key={`list-${levels.map(l => l.stars ?? 0).join("-")}`}

        extraData={levels}
        renderItem={({ item }) => (
          <LevelButton item={item} onPress={onSelectLevel} />
        )}

        // ✅ stable + safe key
        keyExtractor={(item) => `level-${item.id}-${item.stars ?? 0}`}

        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// --------------------
// Styles
// --------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    marginTop: 10,
    color: '#868e96',
    fontSize: 16
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 20,
    paddingBottom: 40
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP
  },
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
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057'
  },
  starRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2
  },
  starIcon: {
    fontSize: 10
  }
});