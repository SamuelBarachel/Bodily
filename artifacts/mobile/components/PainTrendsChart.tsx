import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { type JournalEntry } from "@/context/JournalContext";

const PAIN_COLORS: Record<number, string> = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#eab308",
  4: "#f97316",
  5: "#ef4444",
  6: "#7f1d1d",
};

const CHART_W = 300;
const CHART_H = 90;
const PAD_X = 12;
const PAD_Y = 10;
const DOT_R = 5;

function getDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function painToY(level: number): number {
  const usable = CHART_H - PAD_Y * 2;
  return PAD_Y + ((level - 1) / 5) * usable;
}

function avgPainForDay(entry: JournalEntry | undefined): number | null {
  if (!entry?.painMarkers?.length) return null;
  const sum = entry.painMarkers.reduce((s, m) => s + m.painLevel, 0);
  return sum / entry.painMarkers.length;
}

function interpolateColor(pain: number): string {
  const floored = Math.floor(pain);
  const ceiled = Math.ceil(pain);
  if (floored === ceiled) return PAIN_COLORS[floored] ?? PAIN_COLORS[1];
  return PAIN_COLORS[Math.round(pain)] ?? PAIN_COLORS[1];
}

const WINDOWS = [
  { label: "4w", days: 28 },
  { label: "8w", days: 56 },
  { label: "12w", days: 84 },
];

interface Props {
  entries: Record<string, JournalEntry>;
}

export function PainTrendsChart({ entries }: Props) {
  const colors = useColors();
  const [windowIdx, setWindowIdx] = useState(0);
  const { days: windowDays } = WINDOWS[windowIdx];

  const points = useMemo(() => {
    return Array.from({ length: windowDays }, (_, i) => {
      const daysAgo = windowDays - 1 - i;
      const dateStr = getDateStr(daysAgo);
      const entry = entries[dateStr];
      const pain = avgPainForDay(entry);
      return { dateStr, daysAgo, pain, index: i };
    });
  }, [entries, windowDays]);

  const filledPoints = points.filter((p) => p.pain !== null);
  const hasData = filledPoints.length > 0;

  const trend = useMemo(() => {
    if (filledPoints.length < 2) return null;
    const half = Math.ceil(filledPoints.length / 2);
    const recent = filledPoints.slice(-half);
    const older = filledPoints.slice(0, half);
    const recentAvg = recent.reduce((s, p) => s + (p.pain ?? 0), 0) / recent.length;
    const olderAvg = older.reduce((s, p) => s + (p.pain ?? 0), 0) / older.length;
    const delta = recentAvg - olderAvg;
    if (Math.abs(delta) < 0.3) return { label: "Stable", color: colors.primary, icon: "→" };
    if (delta < 0) return { label: "Improving", color: PAIN_COLORS[1], icon: "↓" };
    return { label: "Worsening", color: PAIN_COLORS[5], icon: "↑" };
  }, [filledPoints, colors.primary]);

  const overallAvg = useMemo(() => {
    if (!hasData) return null;
    return filledPoints.reduce((s, p) => s + (p.pain ?? 0), 0) / filledPoints.length;
  }, [filledPoints, hasData]);

  const xForIndex = (i: number) =>
    PAD_X + (i / (windowDays - 1)) * (CHART_W - PAD_X * 2);

  const linePath = useMemo(() => {
    const pts = filledPoints.map((p) => ({
      x: xForIndex(p.index),
      y: painToY(p.pain!),
    }));
    if (pts.length < 2) return "";
    return pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
  }, [filledPoints, windowDays]);

  const areaPath = useMemo(() => {
    const pts = filledPoints.map((p) => ({
      x: xForIndex(p.index),
      y: painToY(p.pain!),
    }));
    if (pts.length < 2) return "";
    const line = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
    const bottom = CHART_H - PAD_Y;
    return `${line} L${pts[pts.length - 1].x.toFixed(1)},${bottom} L${pts[0].x.toFixed(1)},${bottom} Z`;
  }, [filledPoints, windowDays]);

  const weekLabels = useMemo(() => {
    const count = Math.round(windowDays / 7);
    return Array.from({ length: count + 1 }, (_, i) => {
      const daysAgo = windowDays - i * 7;
      if (daysAgo < 0) return null;
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const mo = d.toLocaleDateString("en-US", { month: "short" });
      const day = d.getDate();
      return { label: `${mo} ${day}`, x: xForIndex(windowDays - 1 - (windowDays - 1 - i * 7)) };
    }).filter(Boolean);
  }, [windowDays]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Pain Trends
          </Text>
          {hasData && overallAvg !== null && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Average pain{" "}
              <Text style={{ color: interpolateColor(overallAvg), fontFamily: "Inter_600SemiBold" }}>
                {overallAvg.toFixed(1)}/6
              </Text>
            </Text>
          )}
        </View>

        <View style={styles.headerRight}>
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: trend.color + "18", borderColor: trend.color }]}>
              <Text style={[styles.trendIcon, { color: trend.color }]}>{trend.icon}</Text>
              <Text style={[styles.trendLabel, { color: trend.color, fontFamily: "Inter_600SemiBold" }]}>
                {trend.label}
              </Text>
            </View>
          )}
          <View style={styles.windowPicker}>
            {WINDOWS.map((w, i) => (
              <TouchableOpacity
                key={w.label}
                style={[
                  styles.windowBtn,
                  i === windowIdx
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.muted },
                ]}
                onPress={() => setWindowIdx(i)}
              >
                <Text
                  style={[
                    styles.windowBtnText,
                    {
                      color: i === windowIdx ? "#fff" : colors.mutedForeground,
                      fontFamily: "Inter_600SemiBold",
                    },
                  ]}
                >
                  {w.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {!hasData ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            No pain data in this window yet. Mark areas on the Body tab to start tracking.
          </Text>
        </View>
      ) : (
        <>
          {/* Y-axis labels */}
          <View style={styles.chartWrap}>
            <View style={styles.yAxis}>
              {[6, 4, 2].map((level) => (
                <Text
                  key={level}
                  style={[
                    styles.yLabel,
                    { color: PAIN_COLORS[level], fontFamily: "Inter_600SemiBold" },
                  ]}
                >
                  {level}
                </Text>
              ))}
            </View>

            <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="xMidYMid meet">
              <Defs>
                <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={PAIN_COLORS[Math.round(overallAvg ?? 3)]} stopOpacity="0.25" />
                  <Stop offset="1" stopColor={PAIN_COLORS[Math.round(overallAvg ?? 3)]} stopOpacity="0.02" />
                </LinearGradient>
              </Defs>

              {/* Horizontal grid lines at pain 2, 4, 6 */}
              {[2, 4, 6].map((level) => (
                <Line
                  key={`grid-${level}`}
                  x1={PAD_X}
                  y1={painToY(level)}
                  x2={CHART_W - PAD_X}
                  y2={painToY(level)}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              ))}

              {/* Area fill */}
              {areaPath ? (
                <Path d={areaPath} fill="url(#areaGrad)" />
              ) : null}

              {/* Line */}
              {linePath ? (
                <Path
                  d={linePath}
                  stroke={interpolateColor(overallAvg ?? 3)}
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {/* Dots */}
              {filledPoints.map((p) => {
                const cx = xForIndex(p.index);
                const cy = painToY(p.pain!);
                const c = interpolateColor(p.pain!);
                const isToday = p.daysAgo === 0;
                return (
                  <Circle
                    key={p.dateStr}
                    cx={cx}
                    cy={cy}
                    r={isToday ? DOT_R + 2 : DOT_R}
                    fill={c}
                    stroke={isToday ? colors.foreground : "white"}
                    strokeWidth={isToday ? 2 : 1}
                  />
                );
              })}
            </Svg>
          </View>

          {/* X-axis week labels */}
          <View style={[styles.xAxis, { paddingLeft: 28 }]}>
            {weekLabels.slice(0, 5).map((wl, i) => (
              <Text
                key={i}
                style={[styles.xLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
              >
                {wl?.label}
              </Text>
            ))}
          </View>

          {/* Pain level legend */}
          <View style={styles.legend}>
            {[1, 2, 3, 4, 5, 6].map((l) => (
              <View key={l} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: PAIN_COLORS[l] }]} />
                <Text style={[styles.legendNum, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {l}
                </Text>
              </View>
            ))}
            <Text style={[styles.legendRange, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              · low → high
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 17, letterSpacing: -0.2 },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerRight: { alignItems: "flex-end", gap: 8 },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  trendIcon: { fontSize: 13, fontWeight: "700" },
  trendLabel: { fontSize: 12 },
  windowPicker: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    gap: 2,
  },
  windowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  windowBtnText: { fontSize: 12 },
  empty: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  chartWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  yAxis: {
    height: CHART_H,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: PAD_Y - 2,
    width: 20,
  },
  yLabel: { fontSize: 10 },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  xLabel: { fontSize: 10 },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendNum: { fontSize: 11 },
  legendRange: { fontSize: 11, marginLeft: 2 },
});
