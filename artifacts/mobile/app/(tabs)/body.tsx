import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Body from "react-native-body-highlighter";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useSpeechRecognitionEvent } from "expo-speech-recognition";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import { useJournal } from "@/context/JournalContext";
import { summarizeBodilyRecording } from "@workspace/api-client-react";

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

interface MarkedPart {
  painLevel: number;
  notes: string;
  transcript: string;
  summary: string;
}

function formatSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BodyTab() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { saveEntry } = useJournal();

  const [gender, setGender] = useState<"male" | "female">("male");
  const [side, setSide] = useState<"front" | "back">("front");
  const [markedParts, setMarkedParts] = useState<Record<string, MarkedPart>>({});

  const [modalVisible, setModalVisible] = useState(false);
  const [activePart, setActivePart] = useState<any>(null);
  const [selectedPainLevel, setSelectedPainLevel] = useState(0);
  const [notes, setNotes] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;

  useSpeechRecognitionEvent("result", (event) => {
    setTranscript(event.results[0]?.transcript || "");
  });

  const handleBodyPartPress = (part: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePart(part);
    const existing = markedParts[part.slug];
    if (existing) {
      setSelectedPainLevel(existing.painLevel);
      setNotes(existing.notes);
      setTranscript(existing.transcript);
    } else {
      setSelectedPainLevel(0);
      setNotes("");
      setTranscript("");
    }
    setModalVisible(true);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
    } else {
      const hasPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!hasPermission.granted) {
        alert("Speech recognition permission is required");
        return;
      }
      setTranscript("");
      ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true });
      setIsRecording(true);
    }
  };

  const handleSave = async () => {
    if (!activePart || selectedPainLevel === 0) return;
    setIsSummarizing(true);

    let summary = "";
    try {
      if (transcript) {
        const combinedInput = `Pain level: ${selectedPainLevel}/6 (${PAIN_LABELS[selectedPainLevel]}). ${transcript}${notes ? ` Notes: ${notes}` : ""}`;
        const res = await summarizeBodilyRecording({
          bodyPart: activePart.slug,
          transcript: combinedInput,
        });
        summary = res.summary;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }

    const updated: Record<string, MarkedPart> = {
      ...markedParts,
      [activePart.slug]: { painLevel: selectedPainLevel, notes, transcript, summary },
    };
    setMarkedParts(updated);

    const partsText = Object.entries(updated)
      .map(
        ([slug, d]) =>
          `• ${formatSlug(slug)}: Pain ${d.painLevel}/6 — ${PAIN_LABELS[d.painLevel]}` +
          (d.notes ? `\n  Notes: ${d.notes}` : "") +
          (d.summary ? `\n  Summary: ${d.summary}` : "")
      )
      .join("\n");

    await saveEntry({
      response: `Pain Map:\n${partsText}`,
      mood: Math.max(1, Math.round(6 - (selectedPainLevel - 1) * (4 / 5))),
      bodyMetrics: {
        energy: 3,
        sleep: 3,
        tension: selectedPainLevel,
        hydration: 3,
      },
    });

    setModalVisible(false);
  };

  const handleClearPart = () => {
    if (!activePart) return;
    const updated = { ...markedParts };
    delete updated[activePart.slug];
    setMarkedParts(updated);
    setModalVisible(false);
  };

  const bodyData = Object.entries(markedParts).map(([slug, data]) => ({
    slug,
    intensity: 1,
    color: PAIN_COLORS[data.painLevel],
  }));

  const marked = Object.values(markedParts);
  const avgPain =
    marked.length > 0
      ? Math.round(marked.reduce((s, p) => s + p.painLevel, 0) / marked.length)
      : 0;

  const activeColor =
    selectedPainLevel > 0 ? PAIN_COLORS[selectedPainLevel] : colors.border;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: topPadding + 16 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Pain Map
        </Text>
        <View style={styles.genderToggle}>
          <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
            Male
          </Text>
          <Switch
            value={gender === "female"}
            onValueChange={(val) => setGender(val ? "female" : "male")}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
          <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
            Female
          </Text>
        </View>
      </View>

      {/* Pain legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendTitle, { color: colors.mutedForeground }]}>
          Pain scale:
        </Text>
        {[1, 2, 3, 4, 5, 6].map((l) => (
          <View key={l} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: PAIN_COLORS[l] }]}
            />
            <Text style={[styles.legendNum, { color: colors.mutedForeground }]}>
              {l}
            </Text>
          </View>
        ))}
      </View>

      {/* Rotate control */}
      <View style={styles.rotateRow}>
        <TouchableOpacity
          style={[
            styles.sideBtn,
            side === "front" && { backgroundColor: colors.primary },
            side !== "front" && {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setSide("front")}
        >
          <Text
            style={[
              styles.sideBtnText,
              { color: side === "front" ? "#fff" : colors.foreground },
            ]}
          >
            Front
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sideBtn,
            side === "back" && { backgroundColor: colors.primary },
            side !== "back" && {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setSide("back")}
        >
          <Text
            style={[
              styles.sideBtnText,
              { color: side === "back" ? "#fff" : colors.foreground },
            ]}
          >
            Back
          </Text>
        </TouchableOpacity>

        {marked.length > 0 && (
          <View
            style={[
              styles.summaryBadge,
              {
                backgroundColor: PAIN_COLORS[avgPain] + "22",
                borderColor: PAIN_COLORS[avgPain],
              },
            ]}
          >
            <View
              style={[
                styles.summaryDot,
                { backgroundColor: PAIN_COLORS[avgPain] },
              ]}
            />
            <Text
              style={[styles.summaryText, { color: PAIN_COLORS[avgPain] }]}
            >
              {marked.length} area{marked.length > 1 ? "s" : ""} · avg {avgPain}
              /6
            </Text>
          </View>
        )}
      </View>

      {/* Body model */}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Tap any area to mark pain
        </Text>
        <View style={styles.bodyContainer}>
          <Body
            gender={gender}
            data={bodyData}
            onBodyPartPress={handleBodyPartPress}
            colors={["#e0dbd4", colors.primary]}
            scale={isWeb ? 1 : 1.3}
            side={side}
          />
        </View>
      </ScrollView>

      {/* Pain entry modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.card }]}
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                {selectedPainLevel > 0 && (
                  <View
                    style={[
                      styles.modalPainDot,
                      { backgroundColor: PAIN_COLORS[selectedPainLevel] },
                    ]}
                  />
                )}
                <Text
                  style={[styles.modalTitle, { color: colors.foreground }]}
                >
                  {activePart ? formatSlug(activePart.slug) : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Pain scale */}
              <Text
                style={[styles.sectionLabel, { color: colors.foreground }]}
              >
                How much pain? (1 = minimal · 6 = unbearable)
              </Text>
              <View style={styles.painScale}>
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.painBtn,
                      { backgroundColor: PAIN_COLORS[level] },
                      selectedPainLevel === level && styles.painBtnSelected,
                      selectedPainLevel !== level &&
                        selectedPainLevel !== 0 &&
                        styles.painBtnDimmed,
                    ]}
                    onPress={() => setSelectedPainLevel(level)}
                  >
                    <Text style={styles.painBtnNum}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedPainLevel > 0 && (
                <Text
                  style={[
                    styles.painLevelLabel,
                    { color: PAIN_COLORS[selectedPainLevel] },
                  ]}
                >
                  {PAIN_LABELS[selectedPainLevel]}
                </Text>
              )}

              {/* Notes */}
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.foreground, marginTop: 18 },
                ]}
              >
                Notes{" "}
                <Text
                  style={[styles.optionalTag, { color: colors.mutedForeground }]}
                >
                  (any language)
                </Text>
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderColor:
                      notes.length > 0 ? activeColor : colors.border,
                  },
                ]}
                placeholder="Describe what you feel, in any language…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              {/* Voice recording — mobile only */}
              {!isWeb && (
                <>
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: colors.foreground, marginTop: 18 },
                    ]}
                  >
                    Voice description{" "}
                    <Text
                      style={[
                        styles.optionalTag,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      (optional)
                    </Text>
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.recordBtn,
                      {
                        backgroundColor: isRecording
                          ? PAIN_COLORS[5]
                          : colors.muted,
                        borderColor: isRecording
                          ? PAIN_COLORS[5]
                          : colors.border,
                      },
                    ]}
                    onPress={toggleRecording}
                  >
                    <Ionicons
                      name={isRecording ? "stop-circle" : "mic-outline"}
                      size={18}
                      color={isRecording ? "#fff" : colors.foreground}
                    />
                    <Text
                      style={[
                        styles.recordText,
                        {
                          color: isRecording ? "#fff" : colors.foreground,
                        },
                      ]}
                    >
                      {isRecording ? "Stop Recording" : "Record Symptoms"}
                    </Text>
                  </TouchableOpacity>
                  {transcript ? (
                    <View
                      style={[
                        styles.transcriptBox,
                        { backgroundColor: colors.muted },
                      ]}
                    >
                      <Text
                        style={[
                          styles.transcript,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {transcript}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}

              {/* Actions */}
              <View style={styles.modalActions}>
                {markedParts[activePart?.slug] && (
                  <TouchableOpacity
                    style={[
                      styles.clearBtn,
                      { borderColor: colors.border },
                    ]}
                    onPress={handleClearPart}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.mutedForeground}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    {
                      backgroundColor:
                        selectedPainLevel > 0
                          ? PAIN_COLORS[selectedPainLevel]
                          : colors.border,
                      flex: 1,
                    },
                  ]}
                  onPress={handleSave}
                  disabled={selectedPainLevel === 0 || isSummarizing}
                >
                  <Text style={styles.saveBtnText}>
                    {isSummarizing
                      ? "Saving…"
                      : selectedPainLevel > 0
                      ? `Save · Pain ${selectedPainLevel}/6`
                      : "Select a pain level"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  genderToggle: { flexDirection: "row", alignItems: "center", gap: 6 },
  toggleLabel: { fontSize: 13 },

  legend: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 6,
  },
  legendTitle: { fontSize: 12, marginRight: 2 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 2 },
  legendDot: { width: 11, height: 11, borderRadius: 6 },
  legendNum: { fontSize: 11 },

  rotateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 6,
  },
  sideBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sideBtnText: { fontSize: 13, fontWeight: "600" },
  summaryBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  summaryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  summaryText: { fontSize: 13, fontWeight: "600" },

  scroll: { alignItems: "center", paddingBottom: 40 },
  hint: { fontSize: 13, marginBottom: 4, marginTop: 4 },
  bodyContainer: { marginTop: 6 },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalContent: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    paddingBottom: 36,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalPainDot: { width: 14, height: 14, borderRadius: 7 },
  modalTitle: { fontSize: 20, fontWeight: "700" },

  sectionLabel: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  optionalTag: { fontSize: 12, fontWeight: "400" },

  painScale: { flexDirection: "row", gap: 8 },
  painBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  painBtnSelected: {
    transform: [{ scale: 1.18 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  painBtnDimmed: { opacity: 0.45 },
  painBtnNum: { color: "#fff", fontWeight: "800", fontSize: 18 },
  painLevelLabel: {
    textAlign: "center",
    fontWeight: "700",
    marginTop: 10,
    fontSize: 15,
    letterSpacing: 0.2,
  },

  notesInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    lineHeight: 20,
  },

  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  recordText: { fontSize: 14, fontWeight: "600" },
  transcriptBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
  },
  transcript: { fontSize: 13, fontStyle: "italic", lineHeight: 20 },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
