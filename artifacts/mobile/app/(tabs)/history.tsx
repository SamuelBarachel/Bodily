import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJournal, type JournalEntry, type PainMarker } from "@/context/JournalContext";
import { EntryCard } from "@/components/EntryCard";
import { WeeklySparkline } from "@/components/WeeklySparkline";
import { PainTrendsChart } from "@/components/PainTrendsChart";

const PAIN_COLORS: Record<number, string> = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#eab308",
  4: "#f97316",
  5: "#ef4444",
  6: "#7f1d1d",
};

const PAIN_LABELS: Record<number, string> = {
  1: "Barely noticeable",
  2: "Mild",
  3: "Moderate",
  4: "Strong",
  5: "Severe",
  6: "Unbearable",
};

function formatSlug(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PainHistorySection({ entries }: { entries: JournalEntry[] }) {
  const colors = useColors();

  const painEntries = useMemo(
    () =>
      entries
        .filter((e) => e.painMarkers && e.painMarkers.length > 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries]
  );

  if (painEntries.length === 0) return null;

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={[phStyles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        Pain History
      </Text>
      <Text style={[phStyles.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {painEntries.length} pain map{painEntries.length !== 1 ? "s" : ""} recorded
      </Text>

      {painEntries.map((entry) => {
        const markers = entry.painMarkers!;
        const avgPain = Math.round(
          markers.reduce((s, m) => s + m.painLevel, 0) / markers.length
        );
        const avgColor = PAIN_COLORS[avgPain] ?? colors.mutedForeground;

        return (
          <View
            key={entry.id}
            style={[phStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {/* Date + avg pain badge */}
            <View style={phStyles.cardHeader}>
              <Text style={[phStyles.dateText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {formatDate(entry.date)}
              </Text>
              <View style={[phStyles.avgBadge, { backgroundColor: avgColor + "22", borderColor: avgColor }]}>
                <View style={[phStyles.avgDot, { backgroundColor: avgColor }]} />
                <Text style={[phStyles.avgText, { color: avgColor, fontFamily: "Inter_600SemiBold" }]}>
                  avg {avgPain}/6
                </Text>
              </View>
            </View>

            {/* Body part chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              <View style={phStyles.chipsRow}>
                {markers.map((m) => {
                  const c = PAIN_COLORS[m.painLevel];
                  return (
                    <View
                      key={m.slug}
                      style={[phStyles.chip, { backgroundColor: c + "22", borderColor: c }]}
                    >
                      <View style={[phStyles.chipDot, { backgroundColor: c }]} />
                      <Text style={[phStyles.chipSlug, { color: c, fontFamily: "Inter_600SemiBold" }]}>
                        {formatSlug(m.slug)}
                      </Text>
                      <Text style={[phStyles.chipLevel, { color: c, fontFamily: "Inter_700Bold" }]}>
                        {m.painLevel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Worst area callout */}
            {(() => {
              const worst = markers.reduce((a, b) => (a.painLevel >= b.painLevel ? a : b));
              if (worst.painLevel < 4) return null;
              return (
                <View style={[phStyles.worstRow, { backgroundColor: PAIN_COLORS[worst.painLevel] + "12" }]}>
                  <Ionicons name="warning-outline" size={13} color={PAIN_COLORS[worst.painLevel]} />
                  <Text style={[phStyles.worstText, { color: PAIN_COLORS[worst.painLevel], fontFamily: "Inter_500Medium" }]}>
                    {formatSlug(worst.slug)} — {PAIN_LABELS[worst.painLevel]}
                  </Text>
                </View>
              );
            })()}

            {/* Notes snippet */}
            {markers.some((m) => m.notes || m.summary) && (
              <View style={{ marginTop: 8, gap: 4 }}>
                {markers
                  .filter((m) => m.summary || m.notes)
                  .slice(0, 2)
                  .map((m) => (
                    <Text
                      key={m.slug}
                      numberOfLines={2}
                      style={[phStyles.noteText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
                    >
                      <Text style={{ fontFamily: "Inter_500Medium", color: colors.foreground }}>
                        {formatSlug(m.slug)}:{" "}
                      </Text>
                      {m.summary || m.notes}
                    </Text>
                  ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const phStyles = StyleSheet.create({
  sectionTitle: { fontSize: 20, letterSpacing: -0.3, marginBottom: 2 },
  sectionSub: { fontSize: 13, marginBottom: 14 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateText: { fontSize: 15 },
  avgBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  avgDot: { width: 7, height: 7, borderRadius: 4 },
  avgText: { fontSize: 12 },
  chipsRow: { flexDirection: "row", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipSlug: { fontSize: 12 },
  chipLevel: { fontSize: 13 },
  worstRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  worstText: { fontSize: 12 },
  noteText: { fontSize: 13, lineHeight: 18 },
});

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries, userName } = useJournal();

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
    1: colors.mood1, 2: colors.mood2, 3: colors.mood3,
    4: colors.mood4, 5: colors.mood5,
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
          { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 100 },
        ]}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Journal History
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {sortedEntries.length} entr{sortedEntries.length !== 1 ? "ies" : "y"}
            </Text>

            {/* Weekly sparkline */}
            <View style={styles.sparklineWrapper}>
              <WeeklySparkline />
            </View>

            {/* Pain trends chart */}
            <PainTrendsChart entries={entries} />

            {sortedEntries.length > 0 && (
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statNumber, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    {sortedEntries.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Days logged
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statNumber, { color: avgMoodColor, fontFamily: "Inter_700Bold" }]}>
                    {avgLabel}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Average mood
                  </Text>
                </View>
              </View>
            )}

            <PainHistorySection entries={sortedEntries} />

            {sortedEntries.length > 0 && (
              <Text style={[styles.sectionHeader, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                All entries
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => <EntryCard entry={item} />}
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="book-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Nothing here yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
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
  title: { fontSize: 28, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  sparklineWrapper: { marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
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
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
