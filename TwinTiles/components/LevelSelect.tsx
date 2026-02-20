import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import PuzzleBoard from "./PuzzleBoard";

type RootStackParamList = {
  Main: undefined;
  LevelModal: { chapterTitle: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "LevelModal">;

export default function LevelSelect({ route, navigation }: Props) {
  const { chapterTitle } = route.params;

  const levels = ["Level 1", "Level 2", "Level 3", "Level 4"];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{chapterTitle} - Level 1</Text>

      <PuzzleBoard size={4} />

      <TouchableOpacity
        style={[styles.levelButton, { backgroundColor: "#ccc" }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.levelText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  levelButton: {
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    width: 200,
    alignItems: "center",
  },
  levelText: { fontSize: 16, fontWeight: "600" },
});