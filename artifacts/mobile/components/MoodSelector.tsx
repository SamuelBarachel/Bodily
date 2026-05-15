import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

const MOODS = [
  { value: 1, label: "Low", desc: "Drained" },
  { value: 2, label: "Uneasy", desc: "Tired" },
  { value: 3, label: "Neutral", desc: "Okay" },
  { value: 4, label: "Good", desc: "Energized" },
  { value: 5, label: "Vibrant", desc: "Thriving" },
];

interface MoodDotProps {
  mood: { value: number; label: string; desc: string };
  selected: boolean;
  onPress: () => void;
}

function MoodDot({ mood, selected, onPress }: MoodDotProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const moodColorMap: Record<number, string> = {
    1: colors.mood1, 2: colors.mood2, 3: colors.mood3, 4: colors.mood4, 5: colors.mood5,
  };
  const moodColor = moodColorMap[mood.value] ?? colors.muted;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.3, { damping: 6 }, () => {
      scale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.dotWrapper}
      activeOpacity={0.8}
      testID={`mood-${mood.value}`}
    >
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: moodColor,
            borderWidth: selected ? 3 : 0,
            borderColor: colors.foreground,
            width: selected ? 44 : 36,
            height: selected ? 44 : 36,
            borderRadius: selected ? 22 : 18,
          },
          animStyle,
        ]}
      />
      <Text
        style={[
          styles.dotLabel,
          {
            color: selected ? colors.foreground : colors.mutedForeground,
            fontWeight: selected ? "600" : "400",
            fontFamily: selected ? "Inter_600SemiBold" : "Inter_400Regular",
          },
        ]}
      >
        {mood.desc}
      </Text>
    </TouchableOpacity>
  );
}

interface MoodSelectorProps {
  value: number;
  onChange: (v: number) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  const colors = useColors();
  return (
    <View>
      <Text
        style={[
          styles.sectionLabel,
          { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
        ]}
      >
        Overall wellbeing
      </Text>
      <View style={styles.row}>
        {MOODS.map((m) => (
          <MoodDot
            key={m.value}
            mood={m}
            selected={value === m.value}
            onPress={() => onChange(m.value)}
          />
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dotWrapper: {
    alignItems: "center",
    gap: 6,
  },
  dot: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dotLabel: {
    fontSize: 11,
  },
});
