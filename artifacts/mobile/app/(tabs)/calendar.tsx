import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJournal, type JournalEntry } from "@/context/JournalContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function formatDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function CalendarDayCell({
  day,
  dateStr,
  entry,
  isToday,
  onPress,
}: {
  day: number | null;
  dateStr: string;
  entry: JournalEntry | undefined;
  isToday: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  if (day === null) {
    return <View style={styles.dayCell} />;
  }

  const colorMap: Record<number, string> = {
    1: colors.mood1, 2: colors.mood2, 3: colors.mood3, 4: colors.mood4, 5: colors.mood5,
  };
  const moodColor = entry ? colorMap[entry.mood] : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.dayCell,
        moodColor && { backgroundColor: moodColor, borderRadius: 10 },
        isToday && !moodColor && {
          borderWidth: 2,
          borderColor: colors.primary,
          borderRadius: 10,
        },
      ]}
    >
      <Text
        style={[
          styles.dayNumber,
          {
            color: moodColor
              ? "#fff"
              : isToday
              ? colors.primary
              : colors.foreground,
            fontFamily: isToday ? "Inter_700Bold" : "Inter_400Regular",
          },
        ]}
      >
        {day}
      </Text>
      {entry && (
        <View
          style={[styles.entryDot, { backgroundColor: "rgba(255,255,255,0.6)" }]}
        />
      )}
    </TouchableOpacity>
  );
}

function EntryDetailModal({
  entry,
  visible,
  onClose,
}: {
  entry: JournalEntry | null;
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  if (!entry) return null;

  const moodColorMap: Record<number, string> = {
    1: colors.mood1, 2: colors.mood2, 3: colors.mood3, 4: colors.mood4, 5: colors.mood5,
  };
  const moodColor = moodColorMap[entry.mood] ?? colors.primary;
  const moodLabels = ["", "Drained", "Tired", "Okay", "Energized", "Thriving"];

  const [y, m, d] = entry.date.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const displayDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const metrics = [
    { label: "Energy", value: entry.bodyMetrics.energy },
    { label: "Sleep", value: entry.bodyMetrics.sleep },
    { label: "Tension", value: entry.bodyMetrics.tension },
    { label: "Hydration", value: entry.bodyMetrics.hydration },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[styles.modalHeader, { backgroundColor: moodColor }]}>
            <View>
              <Text style={[styles.modalDate, { fontFamily: "Inter_600SemiBold" }]}>
                {displayDate}
              </Text>
              <Text style={[styles.modalMood, { fontFamily: "Inter_400Regular" }]}>
                Feeling {moodLabels[entry.mood]}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingBottom: 16 }}
          >
            <View>
              <Text
                style={[
                  styles.modalLabel,
                  { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
                ]}
              >
                Prompt
              </Text>
              <Text
                style={[
                  styles.modalPrompt,
                  { color: colors.accent, fontFamily: "Inter_500Medium" },
                ]}
              >
                {entry.prompt}
              </Text>
            </View>
            <View>
              <Text
                style={[
                  styles.modalLabel,
                  { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
                ]}
              >
                Reflection
              </Text>
              <Text
                style={[
                  styles.modalResponse,
                  { color: colors.foreground, fontFamily: "Inter_400Regular" },
                ]}
              >
                {entry.response}
              </Text>
            </View>
            <View>
              <Text
                style={[
                  styles.modalLabel,
                  { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
                ]}
              >
                Body Check-in
              </Text>
              <View
                style={[
                  styles.metricsGrid,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {metrics.map((m, i) => (
                  <View key={m.label} style={styles.metricCell}>
                    <Text
                      style={[
                        styles.metricLabel,
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
                            styles.pip,
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries } = useJournal();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const todayStr = now.toISOString().split("T")[0];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDayPress = (day: number) => {
    const dateStr = formatDate(year, month, day);
    const entry = entries[dateStr];
    if (entry) {
      setSelectedEntry(entry);
      setModalVisible(true);
    }
  };

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : insets.bottom;

  const moodColors = [colors.mood1, colors.mood2, colors.mood3, colors.mood4, colors.mood5];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)}>
          <Text
            style={[
              styles.title,
              { color: colors.foreground, fontFamily: "Inter_700Bold" },
            ]}
          >
            Mood Calendar
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            Tap a colored day to read your entry
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={[
            styles.calendarCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrev} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text
              style={[
                styles.monthTitle,
                { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              {MONTHS[month]} {year}
            </Text>
            <TouchableOpacity onPress={handleNext} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-forward" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.dayHeaders}>
            {DAYS.map((d) => (
              <Text
                key={d}
                style={[
                  styles.dayHeader,
                  { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
                ]}
              >
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              const dateStr = day ? formatDate(year, month, day) : "";
              const entry = day ? entries[dateStr] : undefined;
              const isToday = dateStr === todayStr;
              return (
                <CalendarDayCell
                  key={i}
                  day={day}
                  dateStr={dateStr}
                  entry={entry}
                  isToday={isToday}
                  onPress={() => day && handleDayPress(day)}
                />
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text
            style={[
              styles.legendLabel,
              { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
            ]}
          >
            Mood scale
          </Text>
          <View style={styles.legend}>
            {["Drained", "Tired", "Okay", "Energized", "Thriving"].map(
              (label, i) => (
                <View key={label} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: moodColors[i] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      {
                        color: colors.mutedForeground,
                        fontFamily: "Inter_400Regular",
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              )
            )}
          </View>
        </Animated.View>

        {Object.keys(entries).length === 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={[
              styles.emptyState,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="calendar-outline" size={32} color={colors.mutedForeground} />
            <Text
              style={[
                styles.emptyTitle,
                { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              No entries yet
            </Text>
            <Text
              style={[
                styles.emptyText,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              Start journaling to see your mood visualized here
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      <EntryDetailModal
        entry={selectedEntry}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  title: { fontSize: 28, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14 },
  calendarCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthTitle: { fontSize: 17 },
  dayHeaders: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  dayHeader: { fontSize: 11, textAlign: "center", width: 36 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  dayCell: {
    width: "13%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayNumber: { fontSize: 14 },
  entryDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 13 },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 17 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  modalDate: { color: "#fff", fontSize: 16 },
  modalMood: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 2 },
  modalBody: { paddingHorizontal: 20, paddingTop: 16 },
  modalLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  modalPrompt: { fontSize: 15, lineHeight: 22 },
  modalResponse: { fontSize: 15, lineHeight: 23 },
  metricsGrid: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  metricCell: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metricLabel: { fontSize: 14, width: 80 },
  metricPips: { flexDirection: "row", gap: 4 },
  pip: { width: 22, height: 6, borderRadius: 3 },
});
