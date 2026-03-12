import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Import your new shared type
import { LevelModalProps } from "../navigation/types";
import { getChapterProgress } from "../utils/progress";
import { chapters } from "../data/chapters";

export default function LevelSelectScreen({ navigation, route }: LevelModalProps) {
  const chapterId = route.params?.chapterId ?? 1;
  const [unlockedLevel, setUnlockedLevel] = useState(1);

  useEffect(() => {
    const loadProgress = async () => {
      const reached = await getChapterProgress(chapterId);
      setUnlockedLevel(reached);
    };
    loadProgress();
  }, [chapterId]);

  const currentChapter = chapters[chapterId];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{currentChapter.title}</Text>

      <View style={styles.levelGrid}>
        {currentChapter.levels.map((lvl) => {
          const isLocked = lvl.id > unlockedLevel;

          return (
            <TouchableOpacity
              key={lvl.id}
              disabled={isLocked}
              style={[
                styles.levelButton,
                isLocked ? styles.levelLocked : styles.levelUnlocked
              ]}
              onPress={() => {
                console.log("Navigating to level:", lvl.id);
                navigation.navigate("Game", { // <--- Changed this line
                  levelId: lvl.id,
                  chapterId: chapterId
                });
              }}
            >
              {isLocked ? (
                <FontAwesome name="lock" size={24} color="#adb5bd" />
              ) : (
                <Text style={styles.levelText}>{lvl.id}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  levelButton: {
    width: 70,
    height: 70,
    margin: 10,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  levelUnlocked: { backgroundColor: '#4dabf7' },
  levelLocked: { backgroundColor: '#e9ecef', borderWidth: 1, borderColor: '#dee2e6' },
  levelText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
});