import {View, Text, TouchableOpacity, StyleSheet} from "react-native"
import { FlatList } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

type Chapter = {
  id: string,
  title: string,
}

const chapters: Chapter[] = [
  {id: '1', title: 'Chapter 1'},
  {id: '2', title: 'Chapter 2'},
  {id: '3', title: 'Chapter 3'},
  {id: '4', title: 'Chapter 4'},
]

export default function ChapterSelect(){
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
      data={chapters}
      keyExtractor={(item) => item.id}
      renderItem={({item}) => (
        <TouchableOpacity style={styles.chapterItem}>
          <Text style={styles.chapterText}>{item.title}</Text>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listContent}/>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  chapterItem: {
    backgroundColor: "#f2f2f2",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  chapterText: {
    fontSize: 18,
    fontWeight: "600",
  },
});