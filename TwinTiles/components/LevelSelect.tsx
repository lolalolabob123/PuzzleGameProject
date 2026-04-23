import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii, typography, shadows, UITheme } from '../constants/uiTheme';

type LevelItem = {
  id: number;
  stars?: number;
};

type LevelSelectProps = {
  levels: LevelItem[];
  onSelectLevel: (level: LevelItem) => void;
};

type LevelButtonProps = {
  item: LevelItem;
  onPress: (level: LevelItem) => void;
  itemSize: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS_PER_ROW = 4;
const HORIZONTAL_PADDING = spacing.xl;
const GAP_BETWEEN_COLUMNS = spacing.md;

const availableWidthForTiles =
  SCREEN_WIDTH -
  HORIZONTAL_PADDING * 2 -
  GAP_BETWEEN_COLUMNS * (COLUMNS_PER_ROW - 1);

const DEFAULT_ITEM_SIZE = Math.floor(availableWidthForTiles / COLUMNS_PER_ROW);

const LevelButton = ({ item, onPress, itemSize }: LevelButtonProps) => {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  const starsEarned = Number(item.stars ?? 0);
  const displayNumber = item.id ?? '?';
  const isUnplayed = starsEarned === 0;

  return (
    <TouchableOpacity
      style={[
        styles.levelButton,
        { width: itemSize, height: itemSize },
        !isUnplayed && styles.levelButtonCompleted,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <Text style={styles.levelNumber}>{displayNumber}</Text>
      <View style={styles.starRow}>
        {[1, 2, 3].map((starPosition) => (
          <Text
            key={starPosition}
            style={[
              styles.starIcon,
              {
                color:
                  starPosition <= starsEarned
                    ? uiTheme.star
                    : uiTheme.surfaceSunken,
              },
            ]}
          >
            {'\u2605'}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

export default function LevelSelect({ levels, onSelectLevel }: LevelSelectProps) {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  if (levels === undefined) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={uiTheme.primary} />
        <Text style={styles.emptyText}>Loading Levels...</Text>
      </View>
    );
  }

  if (levels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No levels available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={levels}
        extraData={levels}
        renderItem={({ item }) => (
          <LevelButton
            item={item}
            onPress={onSelectLevel}
            itemSize={DEFAULT_ITEM_SIZE}
          />
        )}
        keyExtractor={(item) => `level-${item.id}-${item.stars ?? 0}`}
        numColumns={COLUMNS_PER_ROW}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const makeStyles = (uiTheme: UITheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: uiTheme.background },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: uiTheme.background,
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.md,
    color: uiTheme.textMuted,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: GAP_BETWEEN_COLUMNS,
    marginBottom: GAP_BETWEEN_COLUMNS,
  },
  levelButton: {
    backgroundColor: uiTheme.surfaceMuted,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  levelButtonCompleted: {
    backgroundColor: uiTheme.surface,
    borderWidth: 1,
    borderColor: uiTheme.border,
  },
  levelNumber: {
    ...typography.title,
    color: uiTheme.textSecondary,
  },
  starRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: 2,
  },
  starIcon: {
    fontSize: 10,
  },
});