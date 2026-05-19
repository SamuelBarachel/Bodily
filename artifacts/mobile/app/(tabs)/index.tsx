import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJournal, type BodyMetrics } from "@/context/JournalContext";
import { MoodSelector } from "@/components/MoodSelector";
import { MetricSelector } from "@/components/MetricSelector";
import { InfoModal } from "@/components/InfoModal";

function formatHeaderDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let base: string;
  if (hour < 12) base = "Good morning";
  else if (hour < 17) base = "Good afternoon";
  else base = "Good evening";
  return name ? `${base}, ${name}` : base;
}

function NamePromptModal({
  visible,
  onSave,
}: {
  visible: boolean;
  onSave: (name: string) => void;
}) {
  const colors = useColors();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) setTimeout(() => inputRef.current?.focus(), 300);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={nameStyles.overlay}
      >
        <View
          style={[
            nameStyles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[nameStyles.iconWrap, { backgroundColor: colors.primary + "18" }]}
          >
            <Ionicons name="person-outline" size={28} color={colors.primary} />
          </View>
          <Text
            style={[
              nameStyles.title,
              { color: colors.foreground, fontFamily: "Inter_700Bold" },
            ]}
          >
            Welcome to Bodily
          </Text>
          <Text
            style={[
              nameStyles.subtitle,
              { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            What should we call you?
          </Text>
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            placeholder="Your name"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="done"
            onSubmitEditing={() => draft.trim() && onSave(draft.trim())}
            style={[
              nameStyles.input,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: draft ? colors.primary : colors.border,
                fontFamily: "Inter_400Regular",
              },
            ]}
          />
          <TouchableOpacity
            style={[
              nameStyles.btn,
              {
                backgroundColor:
                  draft.trim() ? colors.primary : colors.border,
              },
            ]}
            disabled={!draft.trim()}
            onPress={() => onSave(draft.trim())}
          >
            <Text
              style={[nameStyles.btnText, { fontFamily: "Inter_600SemiBold" }]}
            >
              Let's go
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const nameStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 22, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, marginTop: -4 },
  input: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginTop: 4,
  },
  btn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: { color: "#fff", fontSize: 16 },
});

const MOOD_LABELS = ["", "Drained", "Tired", "Okay", "Energized", "Thriving"];
const METRIC_LABELS: Record<string, string[]> = {
  energy: ["Depleted", "Low", "Moderate", "High", "Radiant"],
  sleep: ["Poor", "Restless", "Fair", "Good", "Deep"],
  tension: ["Very High", "High", "Moderate", "Low", "None"],
  hydration: ["Parched", "Dry", "Okay", "Good", "Well"],
};

const MILESTONE_MESSAGES: Record<number, { title: string; body: string }> = {
  7: {
    title: "One week strong",
    body: "Seven days of tuning in to your body. That consistency is worth celebrating.",
  },
  30: {
    title: "Thirty day milestone",
    body: "A full month of daily check-ins. Your body has been heard every day.",
  },
  60: {
    title: "Sixty days of presence",
    body: "Two months of showing up for yourself. This is a meaningful practice.",
  },
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

  const levelColorMap: Record<number, string> = {
    1: colors.mood1, 2: colors.mood2, 3: colors.mood3,
    4: colors.mood4, 5: colors.mood5,
  };

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
              <Text style={[styles.savedMetricValue, { color: levelColorMap[m.value] ?? colors.accent, fontFamily: "Inter_600SemiBold" }]}>
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

function MilestoneModal({ streak, onDismiss }: { streak: number; onDismiss: () => void }) {
  const colors = useColors();
  const msg = MILESTONE_MESSAGES[streak];
  if (!msg) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.milestoneOverlay} activeOpacity={1} onPress={onDismiss}>
        <View style={[styles.milestoneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.milestoneBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.milestoneNumber, { fontFamily: "Inter_700Bold" }]}>
              {streak}
            </Text>
            <Text style={[styles.milestoneDays, { fontFamily: "Inter_400Regular" }]}>days</Text>
          </View>
          <Text style={[styles.milestoneTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {msg.title}
          </Text>
          <Text style={[styles.milestoneBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {msg.body}
          </Text>
          <TouchableOpacity
            onPress={onDismiss}
            style={[styles.milestoneDismiss, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.milestoneDismissText, { fontFamily: "Inter_600SemiBold" }]}>
              Keep going
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todayPrompt, todayEntry, saveEntry, loading, streak, newMilestone, clearMilestone, userName, setUserName } = useJournal();

  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [editMode, setEditMode] = useState(!todayEntry);
  const [response, setResponse] = useState("");
  const [mood, setMood] = useState(todayEntry?.mood ?? 3);
  const [metrics, setMetrics] = useState<BodyMetrics>(
    todayEntry?.bodyMetrics ?? { energy: 3, sleep: 3, tension: 3, hydration: 3 }
  );
  const [saving, setSaving] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!loading && !userName) {
      setShowNamePrompt(true);
    }
  }, [loading, userName]);

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
      {/* Floating info button */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setInfoVisible(true);
        }}
        style={[
          styles.infoBtn,
          {
            top: topPadding + 12,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="information-circle-outline" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 100 },
        ]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header row: greeting + streak */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, paddingRight: 44 }}>
            <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {getGreeting(userName || undefined)}
            </Text>
            <Text style={[styles.dateText, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {formatHeaderDate()}
            </Text>
          </View>
        </View>

        {/* Streak pill */}
        {streak > 0 && (
          <View style={[styles.streakPill, { backgroundColor: colors.accent + "18", borderColor: colors.accent + "35" }]}>
            <Ionicons name="flame" size={15} color={colors.accent} />
            <Text style={[styles.streakText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
              {streak} day{streak !== 1 ? "s" : ""} in a row
            </Text>
          </View>
        )}

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

      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />

      {newMilestone !== null && (
        <MilestoneModal streak={newMilestone} onDismiss={clearMilestone} />
      )}

      <NamePromptModal
        visible={showNamePrompt}
        onSave={async (name) => {
          await setUserName(name);
          setShowNamePrompt(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  infoBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: 20, gap: 20 },
  headerRow: { flexDirection: "row", alignItems: "flex-end" },
  greeting: { fontSize: 15, marginBottom: 4 },
  dateText: { fontSize: 28, letterSpacing: -0.5 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: -8,
  },
  streakText: { fontSize: 13 },
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
  milestoneOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  milestoneCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  milestoneBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  milestoneNumber: { color: "#fff", fontSize: 28, lineHeight: 32 },
  milestoneDays: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  milestoneTitle: { fontSize: 22, textAlign: "center", letterSpacing: -0.3 },
  milestoneBody: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  milestoneDismiss: {
    marginTop: 6,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  milestoneDismissText: { color: "#fff", fontSize: 16 },
});
