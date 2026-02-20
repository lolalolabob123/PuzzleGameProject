import { LevelModalProps } from "../navigation/types";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LevelSelect({
  route,
  navigation,
}: LevelModalProps) {
  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        {route.params.chapterTitle}
      </Text>

      <FlatList
        data={levels}
        keyExtractor={(item) => item.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.levelButton}
            onPress={() => {
              navigation.goBack();
              navigation.navigate("Game", {
                chapter: route.params.chapterTitle,
                level: item,
              });
            }}
          >
            <Text style={styles.levelText}>
              Level {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 40,
  },
  levelButton: {
    backgroundColor: "#ffff",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelText: {
    fontSize: 18,
    fontWeight: "600",
  },
});