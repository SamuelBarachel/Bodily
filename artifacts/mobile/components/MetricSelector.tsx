import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const METRICS = [
  {
    key: "energy" as const,
    label: "Energy",
    levels: ["Depleted", "Low", "Moderate", "High", "Radiant"],
  },
  {
    key: "sleep" as const,
    label: "Sleep",
    levels: ["Poor", "Restless", "Fair", "Good", "Deep"],
  },
  {
    key: "tension" as const,
    label: "Tension",
    levels: ["Very High", "High", "Moderate", "Low", "None"],
  },
  {
    key: "hydration" as const,
    label: "Hydration",
    levels: ["Parched", "Dry", "Okay", "Good", "Well"],
  },
];

interface MetricRowProps {
  label: string;
  levels: string[];
  value: number;
  onChange: (v: number) => void;
}

function MetricRow({ label, levels, value, onChange }: MetricRowProps) {
  const colors = useColors();
  return (
    <View style={styles.metricRow}>
      <Text
        style={[
          styles.metricLabel,
          { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
        ]}
      >
        {label}
      </Text>
      <View style={styles.pips}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(n);
            }}
            activeOpacity={0.7}
            style={[
              styles.pip,
              {
                backgroundColor:
                  n <= value ? colors.primary : colors.muted,
                borderRadius: 4,
              },
            ]}
            testID={`metric-${label}-${n}`}
          />
        ))}
      </View>
      <Text
        style={[
          styles.levelText,
          { color: colors.accent, fontFamily: "Inter_500Medium" },
        ]}
      >
        {levels[value - 1]}
      </Text>
    </View>
  );
}

interface MetricSelectorProps {
  values: { energy: number; sleep: number; tension: number; hydration: number };
  onChange: (key: "energy" | "sleep" | "tension" | "hydration", v: number) => void;
}

export function MetricSelector({ values, onChange }: MetricSelectorProps) {
  const colors = useColors();
  return (
    <View>
      <Text
        style={[
          styles.sectionLabel,
          { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
        ]}
      >
        Body check-in
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {METRICS.map((metric, i) => (
          <View key={metric.key}>
            <MetricRow
              label={metric.label}
              levels={metric.levels}
              value={values[metric.key]}
              onChange={(v) => onChange(metric.key, v)}
            />
            {i < METRICS.length - 1 && (
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  metricLabel: {
    fontSize: 14,
    width: 72,
  },
  pips: {
    flexDirection: "row",
    gap: 5,
    flex: 1,
  },
  pip: {
    flex: 1,
    height: 8,
  },
  levelText: {
    fontSize: 12,
    width: 58,
    textAlign: "right",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
});
