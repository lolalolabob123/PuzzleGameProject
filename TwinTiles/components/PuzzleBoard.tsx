import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native"
import { useState, useEffect } from "react"


type PuzzleBoardProps = {
    size?: number
}

export default function PuzzleBoard({ size = 4 }) {
    const screenWidth = Dimensions.get('window').width
    const boardSize = screenWidth - 40
    const cellsSize = boardSize / size

    const [cells, setCells] = useState<number[]>(
        Array(size * size).fill(0)
    )

    const cycleCell = (index: number) => {
        setCells((prev) => {
            const updated = [...prev];
            updated[index] = (updated[index] + 1) % 3;

            if (checkWin(updated)) {
                alert("You Win!");
            }

            return updated;
        });
    };

    const getBackgroundColor = (value: number) => {
        switch (value) {
            case 1:
                return "#4dabf7";
            case 2:
                return "#ff6b6b";
            default:
                return "#ffffff";
        }
    };

    useEffect(() => {
        setCells(Array(size * size).fill(0));
    }, [size]);

    const isBoardFull = (board: number[]) => {
        return board.every((cell) => cell != 0)
    }

    const hasEvenCount = (line: number[]) => {
        const ones = line.filter((c) => c !== 1).length
        const twos = line.filter((c) => c !== 2).length
        return ones === twos
    }

    const hasThreeInRow = (line: number[]) => {
        for (let i = 0; i < line.length - 2; i++) {
            if (
                line[i] !== 0 &&
                line[i] === line[i + 1] &&
                line[i] === line[i + 2]
            ) {
                return true
            }
        }
        return false
    }

    const checkWin = (board: number[]) => {
        if (!isBoardFull(board)) return false

        for (let row = 0; row < size; row++) {
            const rowData = board.slice(row * size, row * size + size)

            if (!hasEvenCount(rowData)) return false
            if (hasThreeInRow(rowData)) return false
        }

for (let col = 0; col < size; col++) {
    const colData: number[] = []

    for (let row = 0; row < size; row++) {
        colData.push(board[row * size + col])
    }

    if (!hasEvenCount(colData)) return false
    if (hasThreeInRow(colData)) return false
}
        return true
    }

    return (
        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
            {cells.map((value, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.cell,
                        {
                            width: cellsSize,
                            height: cellsSize,
                            backgroundColor: getBackgroundColor(value),
                        }
                    ]}
                    onPress={() => cycleCell(index)}>
                    <Text>{value}</Text>
                </TouchableOpacity>
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
    },
});