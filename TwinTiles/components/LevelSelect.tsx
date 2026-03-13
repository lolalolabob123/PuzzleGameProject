import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { LevelModalProps } from "../navigation/types";
import { getChapterProgress } from "../utils/progress";
import { chapters } from "../data/chapters";

export default function LevelSelectScreen({ navigation, route }: LevelModalProps) {
  const { chapterId } = route.params;
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const isFocused = useIsFocused();

  useEffect(() => {
    const loadProgress = async () => {
      const reached = await getChapterProgress(chapterId);
      setUnlockedLevel(Number(reached));
    };
    if (isFocused) loadProgress();
  }, [chapterId, isFocused]);

  const currentChapter = chapters[chapterId];
  if (!currentChapter) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{currentChapter.title}</Text>
      <View style={styles.levelGrid}>
        {currentChapter.levels.map((lvl) => {
          const isLocked = lvl.id > unlockedLevel;
          const isCompleted = lvl.id < unlockedLevel;

          return (
            <TouchableOpacity
              key={lvl.id}
              disabled={isLocked}
              style={[
                styles.levelButton,
                isLocked ? styles.levelLocked : (isCompleted ? styles.levelCompleted : styles.levelUnlocked)
              ]}
              onPress={() => {
                // Determine if we should force a reset based on completion status
                const needsReset = lvl.id < unlockedLevel;
                navigation.navigate("Game", {
                  levelId: lvl.id,
                  chapterId: chapterId,
                  forcedReset: needsReset 
                });
              }}
            >
              {isLocked ? (
                <FontAwesome name="lock" size={24} color="#adb5bd" />
              ) : (
                <View style={styles.cellContent}>
                  <Text style={styles.levelText}>{lvl.id}</Text>
                  {isCompleted && (
                    <FontAwesome name="check-circle" size={14} color="white" style={styles.checkIcon} />
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', backgroundColor: '#f8f9fa' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#212529' },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  levelButton: {
    width: 70, height: 70, margin: 10, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', elevation: 3,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4,
  },
  levelUnlocked: { backgroundColor: '#4dabf7' },
  levelCompleted: { backgroundColor: '#37b24d' },
  levelLocked: { backgroundColor: '#e9ecef', borderWidth: 1, borderColor: '#dee2e6' },
  levelText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  cellContent: { alignItems: 'center', justifyContent: 'center' },
  checkIcon: { position: 'absolute', top: -10, right: -10 }
});