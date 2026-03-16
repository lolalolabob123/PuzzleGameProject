import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChapterSelectProps } from "../navigation/types";

type ChapterItem = {
  id: string;
  title: string;
  color: string;
};

const chapterList: ChapterItem[] = [
  { id: '1', title: 'Chapter 1', color: "#42eb20" },
  { id: '2', title: 'Chapter 2', color: "#f7f308" },
  { id: '3', title: 'Chapter 3', color: "#eb9e11" },
  { id: '4', title: 'Chapter 4', color: "#d41919" },
];

// We use ChapterSelectProps here to define the route and navigation types
export default function ChapterSelect({ navigation, route }: ChapterSelectProps) {
  
  // By using the ChapterSelectProps type, TypeScript now knows themeIndex exists
  // We use a fallback of 0 in case it's not passed
  const themeIndex = (route.params as any)?.themeIndex ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={chapterList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.chapterItem}
            onPress={() => 
              navigation.navigate("LevelModal", { 
                chapterId: Number(item.id),
                themeIndex: themeIndex 
              })
            }
          >
            <Text style={styles.chapterText}>{item.title}</Text>
            <View style={[styles.chapterAccent, { backgroundColor: item.color }]} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 20 },
  chapterItem: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chapterText: { fontSize: 18, fontWeight: "600" },
  chapterAccent: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 8,
    height: 6,
    borderRadius: 4,
  },
});