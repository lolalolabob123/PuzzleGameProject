import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChapterSelectProps } from "../navigation/types";

// --- 1. DATA DEFINITIONS ---
type ChapterItem = {
  id: string;
  title: string;
  color: string;
};

const CHAPTERS_DATA: ChapterItem[] = [
  { id: '1', title: 'Chapter 1', color: "#42eb20" },
  { id: '2', title: 'Chapter 2', color: "#f7f308" },
  { id: '3', title: 'Chapter 3', color: "#eb9e11" },
  { id: '4', title: 'Chapter 4', color: "#d41919" },
];

// --- 2. SUB-COMPONENTS ---

const ChapterCard = ({ item, onPress }: { item: ChapterItem; onPress: () => void }) => (
  <TouchableOpacity 
    style={styles.chapterItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.chapterText}>{item.title}</Text>
    <View style={[styles.chapterAccent, { backgroundColor: item.color }]} />
  </TouchableOpacity>
);

// --- 3. MAIN COMPONENT ---

export default function ChapterSelect({ navigation, route }: ChapterSelectProps) {
  
  const themeIndex = route.params?.themeIndex ?? 0;

  const handleNavigate = (id: string) => {
    navigation.navigate("LevelModal", { 
      chapterId: Number(id),
      themeIndex: themeIndex 
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <FlatList
        data={CHAPTERS_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChapterCard 
            item={item} 
            onPress={() => handleNavigate(item.id)} 
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// --- 4. STYLES ---

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  listContent: { 
    padding: 20,
    paddingTop: 10 
  },
  chapterItem: {
    backgroundColor: "#fff",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: 'center',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  chapterText: { 
    fontSize: 20, 
    fontWeight: "700",
    color: '#212529',
    marginBottom: 4
  },
  chapterAccent: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 12,
    height: 4,
    borderRadius: 2,
    opacity: 0.8
  },
});