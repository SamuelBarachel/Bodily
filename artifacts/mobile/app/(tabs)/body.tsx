import React, { useState } from "react";
import { View, StyleSheet, Text, Platform, TouchableOpacity, ScrollView, Modal, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Body from "react-native-body-highlighter";
import { useColors } from "@/hooks/useColors";
import * as Speech from 'expo-speech';
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useSpeechRecognitionEvent } from "expo-speech-recognition";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import { useJournal } from "@/context/JournalContext";
import { summarizeBodilyRecording } from "@workspace/api-client-react";

export default function BodyTab() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [gender, setGender] = useState<"male" | "female">("male");
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState("");
  const { saveEntry } = useJournal();

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;

  useSpeechRecognitionEvent("result", (event) => {
    setTranscript(event.results[0]?.transcript || "");
  });

  const handleBodyPartPress = (part: any) => {
    setSelectedPart(part);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTranscript("");
    setSummary("");
  };

  const toggleRecording = async () => {
    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      handleSummarize();
    } else {
      const hasPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!hasPermission.granted) {
        alert("Speech recognition permission is required");
        return;
      }
      setTranscript("");
      setSummary("");
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
      });
      setIsRecording(true);
    }
  };

  const handleSummarize = async () => {
    if (!transcript) return;
    setIsSummarizing(true);
    try {
      const res = await summarizeBodilyRecording({
        bodyPart: selectedPart.slug,
        transcript,
      });
      setSummary(res.summary);
      await saveEntry({
        response: `Body part: ${selectedPart.slug}\n\nTranscript: ${transcript}\n\nSummary: ${res.summary}`,
        mood: 3,
        bodyMetrics: { energy: 3, sleep: 3, tension: 3, hydration: 3 }
      });
    } catch (e) {
      console.error(e);
      setSummary("Error summarizing. Saved transcript only.");
      await saveEntry({
        response: `Body part: ${selectedPart.slug}\n\nTranscript: ${transcript}`,
        mood: 3,
        bodyMetrics: { energy: 3, sleep: 3, tension: 3, hydration: 3 }
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPadding + 16 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Body Model</Text>
        <View style={styles.genderToggle}>
          <Text style={{ color: colors.foreground, marginRight: 8 }}>Male</Text>
          <Switch
            value={gender === "female"}
            onValueChange={(val) => setGender(val ? "female" : "male")}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
          <Text style={{ color: colors.foreground, marginLeft: 8 }}>Female</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bodyContainer}>
          <Body
            gender={gender}
            data={[{ slug: selectedPart?.slug || "abs", intensity: 1, color: colors.primary }]}
            onBodyPartPress={handleBodyPartPress}
            colors={["#e8e8e8", colors.primary]}
            scale={isWeb ? 1 : 1.3}
            side="front"
          />
        </View>
      </ScrollView>

      {selectedPart && (
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.partName, { color: colors.foreground }]}>
            Selected: {selectedPart.slug}
          </Text>
          <TouchableOpacity
            style={[styles.recordBtn, { backgroundColor: isRecording ? "#ef4444" : colors.primary }]}
            onPress={toggleRecording}
          >
            <Ionicons name={isRecording ? "stop" : "mic"} size={20} color="#fff" />
            <Text style={styles.recordText}>
              {isRecording ? "Stop Recording" : "Record Symptoms"}
            </Text>
          </TouchableOpacity>

          {transcript ? (
            <Text style={[styles.transcript, { color: colors.mutedForeground }]}>
              {transcript}
            </Text>
          ) : null}

          {isSummarizing ? (
            <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Summarizing with Groq AI...</Text>
          ) : summary ? (
            <View style={{ marginTop: 10 }}>
               <Text style={{ fontWeight: 'bold', color: colors.foreground }}>Summary & Saved:</Text>
               <Text style={[styles.transcript, { color: colors.mutedForeground }]}>{summary}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  genderToggle: { flexDirection: 'row', alignItems: 'center' },
  scroll: { alignItems: 'center', paddingBottom: 120 },
  bodyContainer: { marginTop: 20 },
  panel: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  partName: { fontSize: 18, fontWeight: '600', marginBottom: 12, textTransform: 'capitalize' },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  recordText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  transcript: { marginTop: 12, fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
});
