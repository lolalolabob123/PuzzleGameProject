import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { spacing, radii, typography, shadows, UITheme } from "../constants/uiTheme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TutorialStep {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  instruction: string;
  type: "info" | "interactive";
  highlightArea: "none" | "board" | "counters" | "controls";
  highlightCells: number[] | null;
  highlightCounters: boolean;
  targetCellIndex?: number;
  expectedValue?: number;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: 1,
    totalSteps: 5,
    title: "Welcome to TwinTiles!",
    description: "Let's learn the basic rules of the game in quick steps.",
    instruction: "Tap Next Step to begin the tutorial.",
    type: "info",
    highlightArea: "none",
    highlightCells: null,
    highlightCounters: false,
  },
  {
    step: 2,
    totalSteps: 5,
    title: "Rule #1: The 2-Tile Limit",
    description: "You can NEVER place more than 2 tiles of the same color directly next to each other in a row or column.",
    instruction: "Notice the highlighted adjacent tiles on the board below.",
    type: "info",
    highlightArea: "none",
    highlightCells: [8, 9, 10],
    highlightCounters: false,
  },
  {
    step: 3,
    totalSteps: 5,
    title: "Rule #2: Equal Balance",
    description: "Look at the edge counters. Each row and column must contain an equal number of both tile colors.",
    instruction: "Check the row and column ratio indicators along the edges.",
    type: "info",
    highlightArea: "counters",
    highlightCells: null,
    highlightCounters: true,
  },
  {
    step: 4,
    totalSteps: 5,
    title: "Fixed Starting Tiles",
    description: "Tiles pre-filled with numbers at the start of a puzzle are fixed in place and cannot be changed.",
    instruction: "Use these starting tiles as anchors to deduce surrounding colors.",
    type: "info",
    highlightArea: "none",
    highlightCells: [0, 2],
    highlightCounters: false,
  },
  {
    step: 5,
    totalSteps: 5,
    title: "You're Ready!",
    description: "Remember: check edge counters and avoid 3 of the same color in a row. Use Hint or Skip whenever you get stuck!",
    instruction: "You're all set to play!",
    type: "info",
    highlightArea: "none",
    highlightCells: null,
    highlightCounters: false,
  },
];

interface Props {
  visible: boolean;
  onFinish: () => void | Promise<void>;
  onTileTapRequired?: (cellIndex: number) => void;
  currentGridState?: number[];
  onHighlightCellChange?: (cellIndex: number | number[] | null) => void;
  onHighlightCountersChange?: (highlight: boolean) => void;
  layouts?: {
    board?: LayoutRect;
    counters?: LayoutRect;
    controls?: LayoutRect;
  };
}

export const InteractiveTutorial: React.FC<Props> = ({
  visible,
  onFinish,
  currentGridState = [],
  onHighlightCellChange,
  onHighlightCountersChange,
  layouts,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const { ui: uiTheme } = useTheme();
  const styles = React.useMemo(() => makeStyles(uiTheme), [uiTheme]);

  const step = TUTORIAL_STEPS[currentStepIdx];

  useEffect(() => {
    if (!visible) {
      onHighlightCellChange?.(null);
      onHighlightCountersChange?.(false);
      return;
    }

    if (step.highlightCells) {
      onHighlightCellChange?.(step.highlightCells);
    } else if (step.type === "interactive" && step.targetCellIndex !== undefined) {
      onHighlightCellChange?.(step.targetCellIndex);
    } else {
      onHighlightCellChange?.(null);
    }

    onHighlightCountersChange?.(step.highlightCounters ?? false);
  }, [currentStepIdx, step, visible, onHighlightCellChange, onHighlightCountersChange]);

  useEffect(() => {
    if (step.type === "interactive" || step.highlightArea !== "none") {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [step, pulseAnim]);

  if (!visible) return null;

  const handleNext = () => {
    if (currentStepIdx < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      setCurrentStepIdx(0);
      onHighlightCellChange?.(null);
      onHighlightCountersChange?.(false);
      onFinish();
    }
  };

  const handleSkip = () => {
    setCurrentStepIdx(0);
    onHighlightCellChange?.(null);
    onHighlightCountersChange?.(false);
    onFinish();
  };

  const renderSpotlight = () => {
    if (step.highlightArea === "counters" || step.highlightArea === "board") {
      const layout = step.highlightArea === "counters" ? layouts?.counters : layouts?.board;

      if (!layout || layout.width === 0 || layout.height === 0) {
        return null;
      }

      return (
        <Animated.View
          style={[
            styles.spotlightBase,
            styles.spotlightCountersColor,
            {
              top: layout.y - 6,         // Add slight padding around the card
              left: layout.x - 6,
              width: layout.width + 12,
              height: layout.height + 12,
              borderRadius: radii.xl + 4,
            },
            { transform: [{ scale: pulseAnim }] },
          ]}
          pointerEvents="none"
        />
      );
    }

    return null;
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <View
        style={styles.backdrop}
        pointerEvents={step.type === "interactive" ? "none" : "auto"}
      />

      {renderSpotlight()}

      <View
        style={[
          styles.cardContainer,
          { bottom: spacing.xl }
        ]}
        pointerEvents="auto"
      >
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.stepCounter}>
              STEP {currentStepIdx + 1} OF {TUTORIAL_STEPS.length}
            </Text>
            <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.descriptionText}>{step.description}</Text>
          <Text style={styles.instruction}>{step.instruction}</Text>

          {step.type === "info" && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.nextButtonText}>
                {currentStepIdx === TUTORIAL_STEPS.length - 1 ? "Start Playing" : "Next Step"}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={uiTheme.onPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    cardContainer: {
      position: "absolute",
      left: spacing.lg,
      right: spacing.lg,
      alignItems: "center",
      zIndex: 999,
    },
    card: {
      width: "100%",
      backgroundColor: uiTheme.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      ...shadows.md,
      borderWidth: 1.5,
      borderColor: uiTheme.primary,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    stepCounter: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: "800",
      color: uiTheme.primary,
      letterSpacing: 1,
    },
    skipText: {
      ...typography.caption,
      color: uiTheme.textMuted,
      fontWeight: "600",
    },
    title: {
      ...typography.title,
      fontSize: 18,
      color: uiTheme.textPrimary,
      marginBottom: spacing.xs,
    },
    descriptionText: {
      ...typography.body,
      fontSize: 13,
      color: uiTheme.textPrimary,
      marginBottom: spacing.xs,
    },
    instruction: {
      ...typography.body,
      fontSize: 12,
      color: uiTheme.textMuted,
      lineHeight: 18,
      marginBottom: spacing.md,
      fontStyle: "italic",
    },
    nextButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: uiTheme.primary,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      gap: spacing.xs,
    },
    nextButtonText: {
      ...typography.body,
      fontWeight: "700",
      color: uiTheme.onPrimary,
      fontSize: 14,
    },
    spotlightBase: {
      position: "absolute",
      borderWidth: 3,
      borderColor: "#FFD700",
      zIndex: 1000,
    },
    spotlightCountersColor: {
      borderColor: "#FFD700",
      shadowColor: "#FFD700",
    },
  });