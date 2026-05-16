import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { useJournal } from "@/context/JournalContext";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CHART_H = 60;
const DOT_R = 7;
const PAD_X = 16;
const PAD_Y = 10;

function getDateStr(offsetFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetFromToday);
  return d.toISOString().split("T")[0];
}

function getDayLabel(offsetFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetFromToday);
  return DAY_LABELS[d.getDay()];
}

export function WeeklySparkline() {
  const colors = useColors();
  const { entries } = useJournal();

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const offset = 6 - i; // 6 days ago → today (left → right)
      const dateStr = getDateStr(offset);
      const entry = entries[dateStr];
      return {
        dateStr,
        label: getDayLabel(offset),
        mood: entry?.mood ?? null,
        isToday: offset === 0,
      };
    });
  }, [entries]);

  const filledCount = days.filter((d) => d.mood !== null).length;

  const moodColorMap: Record<number, string> = {
    1: colors.mood1, 2: colors.mood2, 3: colors.mood3,
    4: colors.mood4, 5: colors.mood5,
  };

  // Map mood (1–5) to Y position within chart: 1 (worst) = bottom, 5 (best) = top
  const moodToY = (mood: number) => {
    const usableH = CHART_H - PAD_Y * 2;
    return PAD_Y + usableH - ((mood - 1) / 4) * usableH;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Past 7 days
        </Text>
        {filledCount > 0 && (
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {filledCount} of 7 logged
          </Text>
        )}
      </View>

      {filledCount === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Start logging to see your mood over time
          </Text>
        </View>
      ) : (
        <View>
          <Svg width="100%" height={CHART_H} viewBox={`0 0 300 ${CHART_H}`} preserveAspectRatio="xMidYMid meet">
            {/* Connecting lines between consecutive days that both have data */}
            {days.map((day, i) => {
              if (i === 0) return null;
              const prev = days[i - 1];
              if (day.mood === null || prev.mood === null) return null;
              const segW = (300 - PAD_X * 2) / 6;
              const x1 = PAD_X + (i - 1) * segW;
              const x2 = PAD_X + i * segW;
              const y1 = moodToY(prev.mood);
              const y2 = moodToY(day.mood);
              return (
                <Line
                  key={`line-${i}`}
                  x1={x1} y1={y1}
                  x2={x2} y2={y2}
                  stroke={colors.border}
                  strokeWidth={1.5}
                  strokeDasharray="0"
                />
              );
            })}

            {/* Dots */}
            {days.map((day, i) => {
              const segW = (300 - PAD_X * 2) / 6;
              const cx = PAD_X + i * segW;
              const hasMood = day.mood !== null;
              const cy = hasMood ? moodToY(day.mood!) : CHART_H / 2;
              const fill = hasMood ? moodColorMap[day.mood!] ?? colors.primary : colors.muted;
              return (
                <Circle
                  key={`dot-${i}`}
                  cx={cx}
                  cy={cy}
                  r={hasMood ? DOT_R : 4}
                  fill={fill}
                  stroke={day.isToday ? colors.foreground : "transparent"}
                  strokeWidth={day.isToday ? 2 : 0}
                />
              );
            })}
          </Svg>

          {/* Day labels */}
          <View style={styles.labelsRow}>
            {days.map((day, i) => (
              <Text
                key={i}
                style={[
                  styles.dayLabel,
                  {
                    color: day.isToday ? colors.primary : colors.mutedForeground,
                    fontFamily: day.isToday ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                {day.label}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 15 },
  subtitle: { fontSize: 12 },
  emptyRow: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: PAD_X - 6,
    marginTop: 4,
  },
  dayLabel: {
    fontSize: 11,
    textAlign: "center",
    width: 32,
  },
});
