import { GameScreenProps } from "../navigation/types"
import { Text, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import PuzzleBoard from "../components/PuzzleBoard"
import { chapters } from "../data/chapters"
import { useResponsive } from "../utils/responsive"

function getGridSize(level: number) {
  return level <= 5 ? 4 : 6
}

export default function GameScreen({ route }: GameScreenProps) {
  const { levelId, chapterId } = route.params;
  const { scale } = useResponsive()

  const gridSize = getGridSize(levelId)

  const chapterData = chapters[chapterId]
  const levelData = chapterData.levels[levelId - 1].grid

  return (
    <SafeAreaView style={styles.container}>
      <Text
        style={[styles.title, { fontSize: 20 * scale }]}
        maxFontSizeMultiplier={1.2}
      >
        Chapter {chapterId} - Level {levelId}
      </Text>

      <PuzzleBoard
        size={gridSize}
        levelData={levelData}
        chapterId={chapterId}
        level={levelId}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 20,
  },
})