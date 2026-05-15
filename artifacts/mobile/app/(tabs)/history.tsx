import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJournal, type JournalEntry } from "@/context/JournalContext";
import { EntryCard } from "@/components/EntryCard";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries } = useJournal();

  const sortedEntries: JournalEntry[] = useMemo(() => {
    return Object.values(entries).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [entries]);

  const avgMood = useMemo(() => {
    if (sortedEntries.length === 0) return 0;
    const sum = sortedEntries.reduce((acc, e) => acc + e.mood, 0);
    return sum / sortedEntries.length;
  }, [sortedEntries]);

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : insets.bottom;

  const moodLabels = ["", "Drained", "Tired", "Okay", "Energized", "Thriving"];
  const avgLabel =
    sortedEntries.length > 0
      ? moodLabels[Math.round(avgMood)] ?? "Okay"
      : "—";

  const moodColorMap: Record<number, string> = {
    1: colors.mood1, 2: colors.mood2, 3: colors.mood3, 4: colors.mood4, 5: colors.mood5,
  };
  const avgMoodColor =
    sortedEntries.length > 0
      ? moodColorMap[Math.round(avgMood)] ?? colors.muted
      : colors.muted;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={sortedEntries}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!sortedEntries.length}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: topPadding + 16,
            paddingBottom: bottomPadding + 100,
          },
        ]}
        ListHeaderComponent={
          <Animated.View entering={FadeIn.duration(400)}>
            <Text
              style={[
                styles.title,
                { color: colors.foreground, fontFamily: "Inter_700Bold" },
              ]}
            >
              Journal History
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              {sortedEntries.length} entr{sortedEntries.length !== 1 ? "ies" : "y"}
            </Text>

            {sortedEntries.length > 0 && (
              <View style={styles.statsRow}>
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.statNumber,
                      { color: colors.primary, fontFamily: "Inter_700Bold" },
                    ]}
                  >
                    {sortedEntries.length}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      {
                        color: colors.mutedForeground,
                        fontFamily: "Inter_400Regular",
                      },
                    ]}
                  >
                    Days logged
                  </Text>
                </View>
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.statNumber,
                      { color: avgMoodColor, fontFamily: "Inter_700Bold" },
                    ]}
                  >
                    {avgLabel}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      {
                        color: colors.mutedForeground,
                        fontFamily: "Inter_400Regular",
                      },
                    ]}
                  >
                    Average mood
                  </Text>
                </View>
              </View>
            )}

            <Text
              style={[
                styles.sectionHeader,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Inter_500Medium",
                },
              ]}
            >
              {sortedEntries.length > 0 ? "All entries" : ""}
            </Text>
          </Animated.View>
        }
        renderItem={({ item }) => <EntryCard entry={item} />}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={40}
              color={colors.mutedForeground}
            />
            <Text
              style={[
                styles.emptyTitle,
                { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              Nothing here yet
            </Text>
            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Inter_400Regular",
                },
              ]}
            >
              Your journal entries will appear here once you start writing
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: 20, gap: 0 },
  title: {
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, marginBottom: 20 },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statNumber: { fontSize: 22 },
  statLabel: { fontSize: 12 },
  sectionHeader: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  emptyTitle: { fontSize: 18 },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
