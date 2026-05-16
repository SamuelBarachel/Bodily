import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function InfoModal({ visible, onClose }: InfoModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleEmail = () => {
    Linking.openURL("mailto:takwirira@proton.me");
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          {Platform.OS !== "web" ? (
            <BlurView
              intensity={60}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? "rgba(0,0,0,0.65)"
                    : "rgba(245,240,235,0.75)",
                },
              ]}
            />
          )}

          <TouchableWithoutFeedback>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  marginTop: insets.top + 60,
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>

              <View style={styles.iconRow}>
                <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="leaf" size={28} color="#fff" />
                </View>
              </View>

              <Text
                style={[
                  styles.appName,
                  { color: colors.foreground, fontFamily: "Inter_700Bold" },
                ]}
              >
                Bodily
              </Text>
              <Text
                style={[
                  styles.tagline,
                  { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                ]}
              >
                A daily wellness journal for your whole self
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.attribution}>
                <Text
                  style={[
                    styles.madeBy,
                    { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                  ]}
                >
                  Made with care by
                </Text>
                <Text
                  style={[
                    styles.authorName,
                    { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
                  ]}
                >
                  Samuel Barachel Takwirira
                </Text>
                <Text
                  style={[
                    styles.authorRole,
                    { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                  ]}
                >
                  Graduate student
                </Text>
              </View>

              <View
                style={[
                  styles.donationCard,
                  { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" },
                ]}
              >
                <Ionicons name="heart" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.donationTitle,
                      { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
                    ]}
                  >
                    Donations are welcome
                  </Text>
                  <Text
                    style={[
                      styles.donationBody,
                      { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                    ]}
                  >
                    If Bodily has helped your wellbeing practice, consider supporting its continued development.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleEmail}
                activeOpacity={0.75}
                style={[
                  styles.emailBtn,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Ionicons name="mail-outline" size={18} color={colors.primary} />
                <Text
                  style={[
                    styles.emailText,
                    { color: colors.primary, fontFamily: "Inter_500Medium" },
                  ]}
                >
                  takwirira@proton.me
                </Text>
              </TouchableOpacity>

              <Text
                style={[
                  styles.version,
                  { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                ]}
              >
                Bodily v1.0
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  closeBtn: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 10,
  },
  iconRow: {
    alignItems: "center",
    marginTop: 4,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 26,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: -6,
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  attribution: {
    alignItems: "center",
    gap: 3,
  },
  madeBy: {
    fontSize: 13,
  },
  authorName: {
    fontSize: 18,
    textAlign: "center",
  },
  authorRole: {
    fontSize: 13,
  },
  donationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  donationTitle: {
    fontSize: 14,
    marginBottom: 3,
  },
  donationBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  emailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  emailText: {
    fontSize: 15,
  },
  version: {
    fontSize: 12,
    textAlign: "center",
    marginTop: -4,
  },
});
