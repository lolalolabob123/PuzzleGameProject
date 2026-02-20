import {View, Text, StyleSheet, Dimensions} from "react-native"


type PuzzleBoardProps = {
    size?: number
}

export default function PuzzleBoard({size = 4}){
    const screenWidth = Dimensions.get('window').width
    const boardSize = screenWidth - 40
    const cellsSize = boardSize / size

    const cells = Array.from({length: size * size}, (_, i) => i + 1)

    return (
        <View style={[styles.board, {width: boardSize, height: boardSize}]}>
            {cells.map((num) => (
                <View
                key={num}
                style={[
                    styles.cell,
                    {width: cellsSize, height: cellsSize}
                ]}>
                    <Text style={styles.cellText}>{num}</Text>
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 20,
  },
  cell: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#999",
    backgroundColor: "#fff",
  },
  cellText: {
    fontSize: 20,
    fontWeight: "bold",
  },
});