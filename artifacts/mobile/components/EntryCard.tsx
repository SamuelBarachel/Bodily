import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { JournalEntry } from "@/context/JournalContext";
import { useJournal } from "@/context/JournalContext";

function MoodPip({ mood }: { mood: number }) {
  const colors = useColors();
  const colorMap: Record<number, string> = {
    1: colors.mood1, 2: colors.mood2, 3: colors.mood3, 4: colors.mood4, 5: colors.mood5,
  };
  return (
    <View style={[styles.moodPip, { backgroundColor: colorMap[mood] ?? colors.muted }]} />
  );
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === today.toISOString().split("T")[0]) return "Today";
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

interface EntryCardProps {
  entry: JournalEntry;
  expanded?: boolean;
}

export function EntryCard({ entry, expanded: initialExpanded = false }: EntryCardProps) {
  const colors = useColors();
  const { deleteEntry } = useJournal();
  const [expanded, setExpanded] = useState(initialExpanded);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteEntry(entry.date),
        },
      ]
    );
  };

  const metrics = [
    { label: "Energy", value: entry.bodyMetrics.energy },
    { label: "Sleep", value: entry.bodyMetrics.sleep },
    { label: "Tension", value: entry.bodyMetrics.tension },
    { label: "Hydration", value: entry.bodyMetrics.hydration },
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded(!expanded)}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <MoodPip mood={entry.mood} />
          <View>
            <Text
              style={[
                styles.dateText,
                { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              {formatDisplayDate(entry.date)}
            </Text>
            <Text
              style={[
                styles.moodText,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              {["", "Drained", "Tired", "Okay", "Energized", "Thriving"][entry.mood]}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.mutedForeground}
          />
        </View>
      </View>

      {!expanded && (
        <Text
          style={[
            styles.preview,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
          numberOfLines={2}
        >
          {entry.response}
        </Text>
      )}

      {expanded && (
        <View style={styles.expandedContent}>
          <Text
            style={[
              styles.promptText,
              { color: colors.accent, fontFamily: "Inter_500Medium" },
            ]}
          >
            {entry.prompt}
          </Text>
          <Text
            style={[
              styles.responseText,
              { color: colors.foreground, fontFamily: "Inter_400Regular" },
            ]}
          >
            {entry.response}
          </Text>
          <View
            style={[styles.metricsDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.metricsRow}>
            {metrics.map((m) => (
              <View key={m.label} style={styles.metricChip}>
                <Text
                  style={[
                    styles.metricChipLabel,
                    {
                      color: colors.mutedForeground,
                      fontFamily: "Inter_400Regular",
                    },
                  ]}
                >
                  {m.label}
                </Text>
                <View style={styles.metricPips}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <View
                      key={n}
                      style={[
                        styles.miniPip,
                        {
                          backgroundColor:
                            n <= m.value ? colors.primary : colors.muted,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  moodPip: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 15,
  },
  moodText: {
    fontSize: 13,
    marginTop: 1,
  },
  deleteBtn: {
    padding: 2,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
  },
  expandedContent: {
    gap: 10,
  },
  promptText: {
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  responseText: {
    fontSize: 15,
    lineHeight: 22,
  },
  metricsDivider: {
    height: 1,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricChip: {
    gap: 4,
    flex: 1,
    minWidth: "40%",
  },
  metricChipLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  metricPips: {
    flexDirection: "row",
    gap: 3,
  },
  miniPip: {
    width: 16,
    height: 5,
    borderRadius: 2,
  },
});
