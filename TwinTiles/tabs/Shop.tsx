import React, { useCallback, useMemo, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    Platform,
    Modal,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useTheme } from "../context/ThemeContext";
import {
    spacing,
    radii,
    typography,
    shadows,
    UITheme,
} from "../constants/uiTheme";
import { AVAILABLE_THEMES, GameTheme } from "../constants/themes";
import {
    getCoins,
    spendCoins,
    addCoins,
    getOwnedItemIds,
    markOwned,
    incrementEffect,
} from "../utils/coins";
import {
    SHOP_ITEMS,
    ShopItem,
    ShopItemCategory,
} from "../data/shopItems";

const SECTION_TITLES: Record<ShopItemCategory, string> = {
    theme: "Themes",
    powerup: "Power-ups",
    cosmetic: "Cosmetics",
};

const SECTION_ORDER: ShopItemCategory[] = ["theme", "powerup", "cosmetic"];

const themeById = (id: string) => AVAILABLE_THEMES.find(t => t.id === id)

type CoinPack = {
    id: string;
    amount: number;
    price: string;
    badge?: string;
}

const COIN_PACKS: CoinPack[] = [
    { id: "small", amount: 100, price: "£0.99" },
    { id: "medium", amount: 500, price: "£3.99", badge: "Popular" },
    { id: "large", amount: 1000, price: "£6.99", badge: "Best Value" },
]

export default function Shop() {
    const { ui: uiTheme } = useTheme();
    const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

    const [coins, setCoins] = useState(0);
    const [owned, setOwned] = useState<string[]>([]);
    const [coinModalVisible, setCoinModalVisible] = useState(false)
    const [previewItem, setPreviewItem] = useState<ShopItem | null>(null)

    const refresh = useCallback(async () => {
        setCoins(await getCoins());
        setOwned(await getOwnedItemIds());
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    const universalNotify = (title: string, message: string) => {
        Platform.OS === "web"
            ? window.alert(message)
            : Alert.alert(title, message);
    };

    const handleBuy = async (item: ShopItem) => {
        const isOwned = !item.consumable && owned.includes(item.id);
        if (isOwned) return;

        if (coins < item.price) {
            universalNotify("Not enough coins", `You need ${item.price - coins} more.`);
            return;
        }

        const ok = await spendCoins(item.price);
        if (!ok) return;

        if (item.consumable && item.effect) {
            await incrementEffect(item.effect);
        } else {
            await markOwned(item.id);
        }
        await refresh();
        universalNotify("Purchased", `You bought ${item.name}.`);
    };

    const handleBuyCoins = async (pack: CoinPack) => {
        await addCoins(pack.amount)
        await refresh()
        setCoinModalVisible(false)
        universalNotify("Coins added", `+${pack.amount} coins`)
    }

    const { width: windowWidth } = useWindowDimensions()

    const { columnCount, cardWidth } = useMemo(() => {
        const horizontalPadding = spacing.lg * 2
        const gap = spacing.md
        const available = windowWidth - horizontalPadding

        const cols =
            available < 540 ? 2 :
                available < 820 ? 3 :
                    4;

        const totalGap = gap * (cols - 1)
        const card = Math.floor((available - totalGap) / cols)
        return { columnCount: cols, cardWidth: card }
    }, [windowWidth])

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={styles.title}>Shop</Text>
                <TouchableOpacity
                    style={styles.coinPill}
                    onPress={() => setCoinModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <FontAwesome5 name="coins" size={14} color={uiTheme.star} />
                    <Text style={styles.coinText}>{coins}</Text>
                    <FontAwesome name="plus-circle" size={14} color={uiTheme.primary} />
                </TouchableOpacity>
            </View>

            <Modal
                visible={coinModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCoinModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setCoinModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalContent}
                        activeOpacity={1}
                        onPress={() => { }}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Get Coins</Text>
                            <TouchableOpacity onPress={() => setCoinModalVisible(false)}>
                                <FontAwesome name="times" size={22} color={uiTheme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Spend coins on themes, hint packs, and more.
                        </Text>

                        {COIN_PACKS.map((pack) => (
                            <TouchableOpacity
                                key={pack.id}
                                style={styles.packRow}
                                onPress={() => handleBuyCoins(pack)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.packIconWrap}>
                                    <FontAwesome5 name="coins" size={24} color={uiTheme.star} />
                                </View>
                                <View style={styles.packInfo}>
                                    <Text style={styles.packAmount}>{pack.amount} coins</Text>
                                    {pack.badge && (
                                        <View style={styles.packBadge}>
                                            <Text style={styles.packBadgeText}>{pack.badge}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.packPriceButton}>
                                    <Text style={styles.packPriceText}>{pack.price}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={previewItem !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setPreviewItem(null)}>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setPreviewItem(null)}
                >
                    <TouchableOpacity
                        style={styles.modalContent}
                        activeOpacity={1}
                        onPress={() => { }}
                    >
                        {previewItem && (
                            <ThemePreviewSheet
                                item={previewItem}
                                isOwned={owned.includes(previewItem.id)}
                                canAfford={coins >= previewItem.price}
                                onClose={() => setPreviewItem(null)}
                                onBuy={async () => {
                                    await handleBuy(previewItem)
                                    setPreviewItem(null)
                                }}
                                uiTheme={uiTheme}
                            />
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <ScrollView
                contentContainerStyle={styles.scrollBody}
                showsVerticalScrollIndicator={false}
            >
                {SECTION_ORDER.map((category) => {
                    const items = SHOP_ITEMS.filter((i) => i.category === category);
                    if (items.length === 0) return null;
                    return (
                        <View key={category} style={styles.section}>
                            <Text style={styles.sectionHeader}>{SECTION_TITLES[category]}</Text>
                            <View style={[styles.grid, { gap: spacing.md }]}>
                                {items.map((item) => (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        isOwned={!item.consumable && owned.includes(item.id)}
                                        canAfford={coins >= item.price}
                                        onBuy={() => handleBuy(item)}
                                        onPreview={() => setPreviewItem(item)}
                                        uiTheme={uiTheme}
                                        cardWidth={cardWidth}
                                    />
                                ))}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

type ItemCardProps = {
    item: ShopItem;
    isOwned: boolean;
    canAfford: boolean;
    onBuy: () => void;
    onPreview: () => void;
    uiTheme: UITheme;
    cardWidth: number;
};

const ThemePreview = ({ theme }: { theme: GameTheme }) => (
    <View
        style={{
            width: 76,
            height: 76,
            backgroundColor: theme.tileColor,
            borderColor: theme.tileEdgeColor,
            borderWidth: 1.5,
            borderRadius: 12,
            padding: 6,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 4,
            alignContent: "center",
            justifyContent: "center",
        }}
    >
        <View
            style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.shape1Color,
            }}
        />
        <View
            style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.shape2Color,
            }}
        />
        <View
            style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.shape2Color,
            }}
        />
        <View
            style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.shape1Color,
            }}
        />
    </View>
);

const ThemePreviewSheet = ({
    item,
    isOwned,
    canAfford,
    onClose,
    onBuy,
    uiTheme,
}: {
    item: ShopItem;
    isOwned: boolean;
    canAfford: boolean;
    onClose: () => void;
    onBuy: () => void;
    uiTheme: UITheme;
}) => {
    const theme = themeById(item.id)
    if (!theme) return null

    const tiles = Array.from({ length: 16 }, (_, i) => {
        const row = Math.floor(i / 4)
        const col = i % 4
        const val = (row * col) % 2 === 0 ? 1 : 2
        return val
    })

    const buttonLabel = isOwned
        ? "Owned"
        : !canAfford
            ? `Need ${item.price} coins`
            : `Buy for ${item.price}`

    return (
        <View style={{ alignItems: 'center' }}>
            <Text
                style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: uiTheme.textPrimary,
                    marginBottom: 4
                }}>
                {item.name}
            </Text>
            {item.description && (
                <Text style={{
                    fontSize: 13,
                    color: uiTheme.textMuted,
                    marginBottom: 16,
                    textAlign: "center",
                }}
                >
                    {item.description}
                </Text>
            )}

            <View
                style={{
                    width: 220,
                    height: 220,
                    flexDirection: "row",
                    flexWrap: "wrap",
                    backgroundColor: theme.tileColor,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.tileEdgeColor,
                    overflow: "hidden",
                    marginBottom: 20,
                }}
            >
                {tiles.map((val, i) => (
                    <View
                        key={i}
                        style={{
                            width: 55,
                            height: 55,
                            padding: 4,
                            justifyContent: "center",
                            borderWidth: 0.5,
                            borderColor: theme.tileEdgeColor,
                            backgroundColor: theme.tileColor,
                        }}
                    >
                        <View
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: val === 1 ? theme.shape1Color : theme.shape2Color,
                            }}
                        >
                        </View>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                onPress={isOwned || !canAfford ? onClose : onBuy}
                disabled={isOwned}
                style={{
                    backgroundColor: isOwned
                        ? uiTheme.success
                        : !canAfford
                            ? uiTheme.surfaceMuted
                            : uiTheme.primary,
                    paddingVertical: 14,
                    paddingHorizontal: 32,
                    borderRadius: 999,
                    minWidth: 200,
                    alignItems: "center",
                }}>
                <Text
                    style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: isOwned
                            ? "#FFFFF"
                            : !canAfford
                                ? uiTheme.textMuted
                                : uiTheme.onPrimary,
                    }}
                >
                    {buttonLabel}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{ marginTop: 8 }}>
                <Text style={{ color: uiTheme.textMuted, fontSize: 14, fontWeight: "600" }}>
                    Close
                </Text>
            </TouchableOpacity>
        </View>
    )
}

const ItemCard = ({ item, isOwned, canAfford, onBuy, onPreview, uiTheme, cardWidth }: ItemCardProps) => {
    const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);
    const disabled = isOwned || !canAfford;

    return (
        <TouchableOpacity
            style={[styles.card, { width: cardWidth }, disabled && styles.cardDisabled]}
            onPress={() => {
                if (item.category === "theme") onPreview();
                else onBuy()
            }}
            disabled={isOwned}
            activeOpacity={0.85}
        >
            <View style={styles.cardIconWrap}>
                {item.category === "theme" && themeById(item.id) ? (
                    <ThemePreview theme={themeById(item.id)!} />
                ) : item.image ? (
                    <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
                ) : (
                    <FontAwesome
                        name={(item.iconName ?? "gift") as any}
                        size={26}
                        color={uiTheme.primary}
                    />
                )}
            </View>
            <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
            </Text>
            {item.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                </Text>
            )}

            {isOwned ? (
                <View style={[styles.pricePill, styles.ownedPill]}>
                    <FontAwesome name="check" size={12} color="#FFFFFF" />
                    <Text style={styles.ownedText}>Owned</Text>
                </View>
            ) : (
                <View
                    style={[
                        styles.pricePill,
                        !canAfford && styles.pricePillDisabled,
                    ]}
                >
                    <FontAwesome5 name="coins" size={12} color={uiTheme.star} />
                    <Text style={styles.priceText}>{item.price}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const makeStyles = (uiTheme: UITheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: uiTheme.background,
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.sm,
        },
        title: {
            ...typography.display,
            color: uiTheme.textPrimary,
        },
        coinPill: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            backgroundColor: uiTheme.surface,
            borderRadius: radii.pill,
            borderWidth: 1,
            borderColor: uiTheme.border,
            ...shadows.sm,
        },
        coinText: {
            ...typography.caption,
            color: uiTheme.textPrimary,
        },
        scrollBody: {
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
        },
        section: {
            marginTop: spacing.xl,
        },
        sectionHeader: {
            ...typography.micro,
            fontSize: 14,
            color: uiTheme.textMuted,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: spacing.sm,
        },
        grid: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
        },
        card: {
            backgroundColor: uiTheme.surface,
            borderRadius: radii.md,
            padding: spacing.md,
            marginBottom: spacing.md,
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: uiTheme.border,
            minHeight: 200,
            ...shadows.sm,
        },
        cardDisabled: {
            opacity: 0.7,
        },
        cardIconWrap: {
            width: 80,
            height: 80,
            borderRadius: radii.md,
            backgroundColor: uiTheme.surfaceMuted,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: spacing.sm,
        },
        cardImage: {
            width: 44,
            height: 44,
        },
        cardName: {
            ...typography.caption,
            color: uiTheme.textPrimary,
            textAlign: "center",
        },
        cardDesc: {
            ...typography.micro,
            color: uiTheme.textMuted,
            textAlign: "center",
            marginTop: spacing.xs,
            marginBottom: spacing.sm,
            minHeight: 28,
        },
        pricePill: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            backgroundColor: uiTheme.surfaceMuted,
            borderRadius: radii.pill,
            marginTop: "auto",
        },
        pricePillDisabled: {
            opacity: 0.5,
        },
        priceText: {
            ...typography.caption,
            color: uiTheme.textPrimary,
        },
        ownedPill: {
            backgroundColor: uiTheme.success,
        },
        ownedText: {
            ...typography.caption,
            color: "#FFFFFF",
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: spacing.xl,
        },
        modalContent: {
            width: "100%",
            maxWidth: 420,
            backgroundColor: uiTheme.surface,
            borderRadius: radii.xl,
            padding: spacing.xl,
            borderWidth: 1,
            borderColor: uiTheme.border,
            ...shadows.md,
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing.xs,
        },
        modalTitle: {
            ...typography.display,
            fontSize: 24,
            color: uiTheme.textPrimary,
        },
        modalSubtitle: {
            ...typography.caption,
            color: uiTheme.textMuted,
            marginBottom: spacing.lg,
        },
        packRow: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            backgroundColor: uiTheme.surfaceMuted,
            borderRadius: radii.md,
            marginBottom: spacing.sm,
            borderWidth: 1,
            borderColor: uiTheme.border,
        },
        packIconWrap: {
            width: 44,
            height: 44,
            borderRadius: radii.md,
            backgroundColor: uiTheme.surface,
            justifyContent: "center",
            alignItems: "center",
            marginRight: spacing.md,
        },
        packInfo: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
        },
        packAmount: {
            ...typography.body,
            color: uiTheme.textPrimary,
            fontWeight: "700",
        },
        packBadge: {
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            backgroundColor: uiTheme.primary,
            borderRadius: radii.pill,
        },
        packBadgeText: {
            ...typography.micro,
            color: "#FFFFFF",
        },
        packPriceButton: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            backgroundColor: uiTheme.success,
            borderRadius: radii.pill,
        },
        packPriceText: {
            ...typography.caption,
            color: "#FFFFFF",
            fontWeight: "700",
        },
    });