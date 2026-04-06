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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const SCREEN_PADDING = 20;
const COLUMN_GAP = 15;

const availableWidth = SCREEN_WIDTH - (SCREEN_PADDING * 2) - (COLUMN_GAP * (NUM_COLUMNS - 1));
const ITEM_SIZE = Math.floor(availableWidth / NUM_COLUMNS);

export default function LevelSelect({ levels, onSelectLevel }: any) {
  
  // 1. Handle the "Waiting for Data" state
  if (levels === undefined) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#228be6" />
        <Text style={{ marginTop: 10, color: '#868e96' }}>Loading Levels...</Text>
      </View>
    );
  }

  // 2. Handle the "Truly Empty" state
  if (levels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: '#868e96' }}>No levels available for this chapter.</Text>
      </View>
    );
  }

const renderItem = ({ item }: any) => {
  const displayNum = item.id ?? "?";
  const stars = item.stars || 0;
  
  return (
    <TouchableOpacity 
      style={[styles.levelButton, { width: ITEM_SIZE, height: ITEM_SIZE }]}
      onPress={() => onSelectLevel(item)}
    >
      <Text style={styles.levelText}>{displayNum}</Text>
      
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {[1, 2, 3].map((s) => (
          <Text 
            key={s} 
            style={{ fontSize: 10, color: s <= stars ? "#fcc419" : "#dee2e6" }}
          >
            ⭐
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

  return (
    <View style={styles.container}>
      <FlatList
        data={levels}
        renderItem={renderItem}
        keyExtractor={(item, index) => (item.id || index).toString()}
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
    shadowRadius: 4,
  },
  levelText: { fontSize: 18, fontWeight: 'bold', color: '#495057' },
  starRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2
  },
  starIcon: {
    fontSize: 10,
  }
});