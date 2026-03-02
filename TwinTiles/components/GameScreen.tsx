import { GameScreenProps } from "../navigation/types";
import {Text, StyleSheet} from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context"
import PuzzleBoard, {level1_4x4} from "./PuzzleBoard";
import { chapters } from "../data/chapters";

  function getGridSize(level: number){
    return (
      4 + Math.floor((level - 1) / 5)
    )
  }
  

export default function GameScreen({ route }: GameScreenProps) {
  const { chapter, level } = route.params;

  const gridSize = getGridSize(level)

  const chapterData = chapters[Number(chapter)]
  const levelData = chapterData.levels[level - 1].grid

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        {chapter} - Level {level}
      </Text>
      <PuzzleBoard size={4} levelData={levelData} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
});