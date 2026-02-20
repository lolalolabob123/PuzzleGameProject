import { GameScreenProps } from "../navigation/types";
import {Text} from 'react-native'
import PuzzleBoard from "./PuzzleBoard";

export default function GameScreen({ route }: GameScreenProps) {
  const { chapter, level } = route.params;

  return (
    <>
      <Text>
        {chapter} - Level {level}
      </Text>
      <PuzzleBoard size={4} />
    </>
  );
}