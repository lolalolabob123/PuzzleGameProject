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

export interface StepConfig {
  id: number;
  title: string;
  instruction: string;
  type: "info" | "interactive";
  targetCellIndex?: number;
  expectedValue?: number;
  highlightArea?: "board" | "counters" | "controls" | "none";
}

const TUTORIAL_STEPS: StepConfig[] = [
  {
    id: 0,
    title: "Welcome to TwinTiles!",
    instruction: "Let's learn the basic rules of the game in 4 quick steps.",
    type: "info",
    highlightArea: "none",
  },
  {
    id: 1,
    title: "Rule #1: The 2-Tile Limit",
    instruction: "You can NEVER place more than 2 tiles of the same color directly next to each other in a row or column.",
    type: "info",
    highlightArea: "board",
  },
  {
    id: 2,
    title: "Rule #2: Equal Balance",
    instruction: "Look at the edge counters. Each row and column must contain an equal number of both tile colors.",
    type: "info",
    highlightArea: "counters",
  },
  {
    id: 3,
    title: "Try It Yourself!",
    instruction: "Tap the highlighted cell on the board to change its color.",
    type: "interactive",
    targetCellIndex: 0,
    expectedValue: 1,
    highlightArea: "board",
  },
  {
    id: 4,
    title: "You're Ready!",
    instruction: "Remember: check edge counters and avoid 3 of the same color in a row. Use Hint or Skip whenever you get stuck!",
    type: "info",
    highlightArea: "controls",
  },
];

interface Props {
  visible: boolean;
  onFinish: () => void | Promise<void>;
  onTileTapRequired?: (cellIndex: number) => void;
  currentGridState?: number[];
  onHighlightCellChange?: (cellIndex: number | null) => void;
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
  layouts,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const { ui: uiTheme } = useTheme();
  const styles = React.useMemo(() => makeStyles(uiTheme), [uiTheme]);

  const step = TUTORIAL_STEPS[currentStepIdx];

  // Notify parent of highlighted tile index
  useEffect(() => {
    if (visible && step.type === "interactive" && step.targetCellIndex !== undefined) {
      onHighlightCellChange?.(step.targetCellIndex);
    } else {
      onHighlightCellChange?.(null);
    }
  }, [currentStepIdx, step, visible, onHighlightCellChange]);

  // Pulsing spotlight animation effect
  useEffect(() => {
    if (step.type === "interactive" || step.highlightArea !== "none") {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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

  // Auto-advance interactive step once tile state matches expectedValue
  useEffect(() => {
    if (
      step.type === "interactive" &&
      step.targetCellIndex !== undefined &&
      step.expectedValue !== undefined
    ) {
      if (currentGridState[step.targetCellIndex] === step.expectedValue) {
        handleNext();
      }
    }
  }, [currentGridState, step]);

  if (!visible) return null;

  const handleNext = () => {
    if (currentStepIdx < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      setCurrentStepIdx(0);
      onHighlightCellChange?.(null);
      onFinish();
    }
  };

  const handleSkip = () => {
    setCurrentStepIdx(0);
    onHighlightCellChange?.(null);
    onFinish();
  };

  // Render distinct spotlight borders depending on highlightArea step and measured layouts
  const renderSpotlight = () => {
    if (step.highlightArea === "board") {
      const boardLayout = layouts?.board;
      const dynamicStyle = boardLayout
        ? {
            top: boardLayout.y,
            left: boardLayout.x,
            width: boardLayout.width,
            height: boardLayout.height,
          }
        : styles.spotlightBoardFallback;

      return (
        <Animated.View
          style={[
            styles.spotlightBase,
            styles.spotlightBoardColor,
            dynamicStyle,
            { transform: [{ scale: pulseAnim }] },
          ]}
          pointerEvents="none"
        />
      );
    }

    if (step.highlightArea === "counters") {
      const countersLayout = layouts?.counters;
      const dynamicStyle = countersLayout
        ? {
            top: countersLayout.y,
            left: countersLayout.x,
            width: countersLayout.width,
            height: countersLayout.height,
          }
        : styles.spotlightCountersFallback;

      return (
        <Animated.View
          style={[
            styles.spotlightBase,
            styles.spotlightCountersColor,
            dynamicStyle,
            { transform: [{ scale: pulseAnim }] },
          ]}
          pointerEvents="none"
        />
      );
    }

    if (step.highlightArea === "controls") {
      const controlsLayout = layouts?.controls;
      const dynamicStyle = controlsLayout
        ? {
            top: controlsLayout.y,
            left: controlsLayout.x,
            width: controlsLayout.width,
            height: controlsLayout.height,
          }
        : styles.spotlightControlsFallback;

      return (
        <Animated.View
          style={[
            styles.spotlightBase,
            styles.spotlightControlsColor,
            dynamicStyle,
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
      {/* 
        Pass pointerEvents="none" when step is interactive so user taps
        pass through directly to the PuzzleBoard underneath!
      */}
      <View
        style={styles.backdrop}
        pointerEvents={step.type === "interactive" ? "none" : "auto"}
      />

      {/* Render active area highlight ring */}
      {renderSpotlight()}

      {/* Floating Guidance Card */}
      <View
        style={[
          styles.cardContainer,
          step.highlightArea === "board" ? { bottom: spacing.xl } : { top: SCREEN_HEIGHT * 0.1 },
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
          <Text style={styles.instruction}>{step.instruction}</Text>

          {step.type === "info" && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.nextButtonText}>
                {currentStepIdx === TUTORIAL_STEPS.length - 1 ? "Start Playing" : "Next Step"}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={uiTheme.onPrimary} />
            </TouchableOpacity>
          )}

          {step.type === "interactive" && (
            <View style={styles.interactiveBadge}>
              <FontAwesome name="hand-pointer-o" size={14} color={uiTheme.warning} />
              <Text style={styles.interactiveText}>Tap highlighted tile on board below</Text>
            </View>
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
    instruction: {
      ...typography.body,
      fontSize: 13,
      color: uiTheme.textMuted,
      lineHeight: 18,
      marginBottom: spacing.md,
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
    interactiveBadge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      backgroundColor: uiTheme.surfaceSunken,
      borderRadius: radii.md,
    },
    interactiveText: {
      ...typography.caption,
      color: uiTheme.warning,
      fontWeight: "700",
    },

    // --- Dynamic & Fallback Spotlight Styles ---
    spotlightBase: {
      position: "absolute",
      borderRadius: radii.lg,
      borderWidth: 3,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 10,
    },
    spotlightBoardColor: {
      borderColor: "#FFD700",
      shadowColor: "#FFD700",
    },
    spotlightCountersColor: {
      borderColor: "#3B82F6",
      shadowColor: "#3B82F6",
    },
    spotlightControlsColor: {
      borderColor: "#10B981",
      shadowColor: "#10B981",
    },
    spotlightBoardFallback: {
      top: SCREEN_HEIGHT * 0.22,
      left: 16,
      width: SCREEN_WIDTH - 32,
      height: SCREEN_WIDTH - 32,
    },
    spotlightCountersFallback: {
      top: SCREEN_HEIGHT * 0.2,
      left: 10,
      width: SCREEN_WIDTH - 20,
      height: SCREEN_WIDTH,
    },
    spotlightControlsFallback: {
      bottom: 12,
      left: 16,
      width: SCREEN_WIDTH - 32,
      height: 64,
      borderRadius: radii.pill,
    },
  });