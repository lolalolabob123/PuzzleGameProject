import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  Main: undefined;
  LevelModal: { chapterTitle: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "LevelModal">;

export default function LevelSelect({ route, navigation }: Props) {
  const { chapterTitle } = route.params;

  const levels = ["Level 1", "Level 2", "Level 3"];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Select a Level for {chapterTitle}</Text>
      {levels.map((level) => (
        <TouchableOpacity
          key={level}
          style={styles.levelButton}
          onPress={() => alert(`Starting ${level} of ${chapterTitle}`)}
        >
          <Text style={styles.levelText}>{level}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[styles.levelButton, { backgroundColor: "#ccc" }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.levelText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  levelButton: {
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    width: 200,
    alignItems: "center",
  },
  levelText: { fontSize: 16, fontWeight: "600" },
});