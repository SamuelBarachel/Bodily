import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJournal, type BodyMetrics } from "@/context/JournalContext";
import { MoodSelector } from "@/components/MoodSelector";
import { MetricSelector } from "@/components/MetricSelector";

function formatHeaderDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const MOOD_LABELS = ["", "Drained", "Tired", "Okay", "Energized", "Thriving"];
const METRIC_LABELS: Record<string, string[]> = {
  energy: ["Depleted", "Low", "Moderate", "High", "Radiant"],
  sleep: ["Poor", "Restless", "Fair", "Good", "Deep"],
  tension: ["Very High", "High", "Moderate", "Low", "None"],
  hydration: ["Parched", "Dry", "Okay", "Good", "Well"],
};

function SavedEntryView({ onEdit }: { onEdit: () => void }) {
  const colors = useColors();
  const { todayEntry } = useJournal();

  if (!todayEntry) return null;

  const moodColorMap: Record<number, string> = {
    1: colors.mood1, 2: colors.mood2, 3: colors.mood3,
    4: colors.mood4, 5: colors.mood5,
  };
  const moodColor = moodColorMap[todayEntry.mood] ?? colors.primary;

  const metrics = [
    { key: "energy", label: "Energy", value: todayEntry.bodyMetrics.energy },
    { key: "sleep", label: "Sleep", value: todayEntry.bodyMetrics.sleep },
    { key: "tension", label: "Tension", value: todayEntry.bodyMetrics.tension },
    { key: "hydration", label: "Hydration", value: todayEntry.bodyMetrics.hydration },
  ];

  return (
    <View style={{ gap: 16 }}>
      <View style={[styles.savedBanner, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
        <Text style={[styles.savedBannerText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
          Today's entry saved
        </Text>
        <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.editLink, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
            Edit
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.savedMoodRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.moodBadge, { backgroundColor: moodColor }]}>
          <Text style={[styles.moodBadgeText, { fontFamily: "Inter_600SemiBold" }]}>
            {MOOD_LABELS[todayEntry.mood]}
          </Text>
        </View>
        <View style={styles.savedMetrics}>
          {metrics.map((m) => (
            <View key={m.key} style={styles.savedMetricItem}>
              <Text style={[styles.savedMetricLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {m.label}
              </Text>
              <Text style={[styles.savedMetricValue, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
                {METRIC_LABELS[m.key]?.[m.value - 1]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.savedReflection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.savedPromptText, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
          {todayEntry.prompt}
        </Text>
        <Text style={[styles.savedResponseText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
          {todayEntry.response}
        </Text>
      </View>
    </View>
  );
}

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todayPrompt, todayEntry, saveEntry, loading } = useJournal();

  const [editMode, setEditMode] = useState(!todayEntry);
  const [response, setResponse] = useState("");
  const [mood, setMood] = useState(todayEntry?.mood ?? 3);
  const [metrics, setMetrics] = useState<BodyMetrics>(
    todayEntry?.bodyMetrics ?? { energy: 3, sleep: 3, tension: 3, hydration: 3 }
  );
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (todayEntry) {
      setMood(todayEntry.mood);
      setMetrics(todayEntry.bodyMetrics);
      setEditMode(false);
    } else {
      setEditMode(true);
      setResponse("");
    }
  }, [todayEntry?.date]);

  const handleEdit = () => {
    setResponse(todayEntry?.response ?? "");
    setMood(todayEntry?.mood ?? 3);
    setMetrics(todayEntry?.bodyMetrics ?? { energy: 3, sleep: 3, tension: 3, hydration: 3 });
    setEditMode(true);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleSave = async () => {
    if (!response.trim()) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveEntry({ response: response.trim(), mood, bodyMetrics: metrics });
    setResponse("");
    setEditMode(false);
    setSaving(false);
    inputRef.current?.blur();
  };

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : insets.bottom;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 100 },
        ]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.dateText, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {formatHeaderDate()}
          </Text>
        </View>

        <View style={[styles.promptCard, { backgroundColor: colors.primary }]}>
          <Ionicons name="leaf-outline" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={[styles.promptText, { fontFamily: "Inter_500Medium" }]}>
            {todayPrompt}
          </Text>
        </View>

        {!editMode && todayEntry ? (
          <SavedEntryView onEdit={handleEdit} />
        ) : (
          <>
            <View style={styles.section}>
              <MoodSelector value={mood} onChange={(v) => setMood(v)} />
            </View>

            <View style={styles.section}>
              <MetricSelector
                values={metrics}
                onChange={(key, v) => setMetrics((prev) => ({ ...prev, [key]: v }))}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Your reflection
              </Text>
              <View style={[styles.textInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  ref={inputRef}
                  value={response}
                  onChangeText={setResponse}
                  multiline
                  placeholder="Write freely about how your body feels today..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.textInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!response.trim() || saving}
                activeOpacity={0.8}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: !response.trim() ? 0.5 : 1,
                  },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#fff" />
                    <Text style={[styles.saveButtonText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                      {todayEntry ? "Update Entry" : "Save Entry"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {todayEntry && (
                <TouchableOpacity
                  onPress={() => { setResponse(""); setEditMode(false); }}
                  style={styles.cancelButton}
                >
                  <Text style={[styles.cancelText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: 20, gap: 24 },
  greeting: { fontSize: 15, marginBottom: 4 },
  dateText: { fontSize: 28, letterSpacing: -0.5 },
  promptCard: {
    borderRadius: 16,
    padding: 18,
    gap: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  promptText: { color: "#fff", fontSize: 16, lineHeight: 23, flex: 1 },
  section: { gap: 0 },
  sectionLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  textInputContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 130,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 110,
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: { fontSize: 16, letterSpacing: 0.2 },
  cancelButton: { paddingVertical: 12, alignItems: "center" },
  cancelText: { fontSize: 15 },
  savedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  savedBannerText: { fontSize: 14, flex: 1 },
  editLink: { fontSize: 14 },
  savedMoodRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  moodBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  moodBadgeText: { color: "#fff", fontSize: 14 },
  savedMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  savedMetricItem: { width: "45%", gap: 2 },
  savedMetricLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.3 },
  savedMetricValue: { fontSize: 14 },
  savedReflection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  savedPromptText: { fontSize: 13, fontStyle: "italic", lineHeight: 18 },
  savedResponseText: { fontSize: 15, lineHeight: 23 },
});
