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
import Animated, {
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
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

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todayPrompt, todayEntry, saveEntry, loading } = useJournal();

  const [response, setResponse] = useState(todayEntry?.response ?? "");
  const [mood, setMood] = useState(todayEntry?.mood ?? 3);
  const [metrics, setMetrics] = useState<BodyMetrics>(
    todayEntry?.bodyMetrics ?? {
      energy: 3,
      sleep: 3,
      tension: 3,
      hydration: 3,
    }
  );
  const [saved, setSaved] = useState(!!todayEntry);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (todayEntry) {
      setResponse(todayEntry.response);
      setMood(todayEntry.mood);
      setMetrics(todayEntry.bodyMetrics);
      setSaved(true);
    }
  }, [todayEntry?.date]);

  const handleMetricChange = (
    key: "energy" | "sleep" | "tension" | "hydration",
    v: number
  ) => {
    setMetrics((prev) => ({ ...prev, [key]: v }));
    setSaved(false);
  };

  const handleMoodChange = (v: number) => {
    setMood(v);
    setSaved(false);
  };

  const handleTextChange = (t: string) => {
    setResponse(t);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!response.trim()) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveEntry({ response: response.trim(), mood, bodyMetrics: metrics });
    setSaving(false);
    setSaved(true);
    inputRef.current?.blur();
  };

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : insets.bottom;

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
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
        <Animated.View entering={FadeIn.duration(400)}>
          <Text
            style={[
              styles.greeting,
              { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            {getGreeting()}
          </Text>
          <Text
            style={[
              styles.dateText,
              { color: colors.foreground, fontFamily: "Inter_700Bold" },
            ]}
          >
            {formatHeaderDate()}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={[
            styles.promptCard,
            { backgroundColor: colors.primary },
          ]}
        >
          <Ionicons
            name="leaf-outline"
            size={16}
            color="rgba(255,255,255,0.7)"
          />
          <Text
            style={[styles.promptText, { fontFamily: "Inter_500Medium" }]}
          >
            {todayPrompt}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(180)}
          style={styles.section}
        >
          <MoodSelector value={mood} onChange={handleMoodChange} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(240)}
          style={styles.section}
        >
          <MetricSelector values={metrics} onChange={handleMetricChange} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.section}
        >
          <Text
            style={[
              styles.sectionLabel,
              {
                color: colors.mutedForeground,
                fontFamily: "Inter_500Medium",
              },
            ]}
          >
            Your reflection
          </Text>
          <View
            style={[
              styles.textInputContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              value={response}
              onChangeText={handleTextChange}
              multiline
              placeholder="Write freely about how your body feels today..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.textInput,
                {
                  color: colors.foreground,
                  fontFamily: "Inter_400Regular",
                },
              ]}
              textAlignVertical="top"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(360)}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!response.trim() || saving}
            activeOpacity={0.8}
            style={[
              styles.saveButton,
              {
                backgroundColor:
                  saved ? colors.muted : colors.primary,
                opacity: !response.trim() ? 0.5 : 1,
              },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name={saved ? "checkmark-circle" : "save-outline"}
                  size={20}
                  color={saved ? colors.primary : "#fff"}
                />
                <Text
                  style={[
                    styles.saveButtonText,
                    {
                      color: saved ? colors.primary : "#fff",
                      fontFamily: "Inter_600SemiBold",
                    },
                  ]}
                >
                  {saved ? "Saved" : "Save Entry"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 24,
  },
  greeting: {
    fontSize: 15,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  promptCard: {
    borderRadius: 16,
    padding: 18,
    gap: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  promptText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 23,
    flex: 1,
  },
  section: {
    gap: 0,
  },
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
  saveButtonText: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
