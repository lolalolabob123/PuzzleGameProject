import { GameScreenProps } from "../navigation/types";
import {Text, StyleSheet} from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context"
import PuzzleBoard from "./PuzzleBoard";
import { chapters } from "../data/chapters";

  function getGridSize(level: number){
    return (
      4 + Math.floor((level - 1) / 5)
    )
  }

  

export default function GameScreen({ route }: GameScreenProps) {
  const { chapter, level } = route.params;

  const gridSize = getGridSize(level)

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        {chapter} - Level {level}
      </Text>
      <PuzzleBoard size={gridSize} />
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