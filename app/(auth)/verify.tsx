import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const C = {
  bg: "#040a1a",
  surface: "#0b1a2f",
  surface2: "#142840",
  indigo: "#635cf1",
  violet: "#7c3aed",
  blue: "#38bdf8",
  emerald: "#22c55e",
  rose: "#f43f5e",
  text: "#e8f0fa",
  muted: "#5e7490",
  dim: "#1a2d42",
};

export default function VerifyScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeFocused, setCodeFocused] = useState(false);

  const handleVerify = async () => {
    if (!isLoaded || !signIn) return;
    if (!code || code.length < 4) {
      setError("Please enter the verification code sent to your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        setError("Verification incomplete. Status: " + result.status);
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        "Invalid code. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !code;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── decorative orb ── */}
      <Animated.View
        entering={FadeIn.duration(1500)}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <View
          style={{
            position: "absolute",
            top: "15%",
            right: -40,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: "rgba(34,197,94,0.05)",
          }}
        />
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── back button ── */}
          <Animated.View entering={FadeIn.delay(100).duration(400)}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => ({
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingVertical: 8,
                paddingRight: 12,
                marginBottom: 24,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={20} color={C.muted} />
              <Text style={{ color: C.muted, fontSize: 15, fontWeight: "500" }}>
                Back
              </Text>
            </Pressable>
          </Animated.View>

          {/* ── icon ── */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(150).springify()}
            style={{ alignItems: "center", marginBottom: 24 }}
          >
            <LinearGradient
              colors={[C.emerald, C.blue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: C.emerald,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <Ionicons name="mail-open" size={34} color="#fff" />
            </LinearGradient>
          </Animated.View>

          {/* ── title ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(250)}
            style={{ marginBottom: 8 }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: C.text,
                textAlign: "center",
                letterSpacing: -0.8,
              }}
            >
              Check your email
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(320)}
            style={{ marginBottom: 36 }}
          >
            <Text
              style={{
                fontSize: 15,
                color: C.muted,
                textAlign: "center",
                lineHeight: 23,
                paddingHorizontal: 8,
              }}
            >
              We sent a verification code to your email.{"\n"}Enter it below to
              complete sign-in.
            </Text>
          </Animated.View>

          {/* ── info banner ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(380)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(56,189,248,0.06)",
              borderWidth: 1,
              borderColor: "rgba(56,189,248,0.12)",
              borderRadius: 12,
              padding: 14,
              gap: 10,
              marginBottom: 24,
            }}
          >
            <Ionicons name="information-circle" size={20} color={C.blue} />
            <Text
              style={{
                color: C.blue,
                fontSize: 13,
                flex: 1,
                lineHeight: 19,
              }}
            >
              Check your spam folder if you don't see the email.
            </Text>
          </Animated.View>

          {/* ── code input ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(440)}
            style={{ marginBottom: 8 }}
          >
            <Text
              style={{
                color: C.muted,
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 8,
                marginLeft: 4,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Verification Code
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.surface2,
                borderWidth: 1.5,
                borderColor: codeFocused ? C.emerald : C.dim,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === "ios" ? 18 : 14,
                gap: 12,
              }}
            >
              <Ionicons
                name="keypad-outline"
                size={20}
                color={codeFocused ? C.emerald : C.muted}
              />
              <TextInput
                style={{
                  flex: 1,
                  color: C.text,
                  fontSize: 22,
                  fontWeight: "700",
                  letterSpacing: 8,
                  textAlign: "center",
                }}
                placeholder="• • • • • •"
                placeholderTextColor={C.dim}
                value={code}
                onChangeText={(t) => {
                  setError(null);
                  setCode(t.trim());
                }}
                onFocus={() => setCodeFocused(true)}
                onBlur={() => setCodeFocused(false)}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                returnKeyType="done"
                onSubmitEditing={handleVerify}
                editable={!loading}
                maxLength={8}
              />
            </View>
          </Animated.View>

          {/* ── error ── */}
          {error && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                backgroundColor: "rgba(244,63,94,0.08)",
                borderWidth: 1,
                borderColor: "rgba(244,63,94,0.15)",
                borderRadius: 12,
                padding: 14,
                gap: 10,
                marginTop: 10,
                marginBottom: 6,
              }}
            >
              <Ionicons
                name="alert-circle"
                size={18}
                color={C.rose}
                style={{ marginTop: 1 }}
              />
              <Text
                style={{ color: C.rose, fontSize: 14, flex: 1, lineHeight: 20 }}
              >
                {error}
              </Text>
            </Animated.View>
          )}

          {/* ── verify button ── */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(540)}
            style={{ marginTop: 20 }}
          >
            <Pressable
              onPress={handleVerify}
              disabled={disabled}
              style={({ pressed }) => ({
                borderRadius: 14,
                overflow: "hidden",
                opacity: disabled ? 0.5 : 1,
                transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
                shadowColor: C.emerald,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: disabled ? 0 : 0.35,
                shadowRadius: 14,
                elevation: disabled ? 0 : 10,
                marginBottom: 20,
              })}
            >
              <LinearGradient
                colors={[C.emerald, C.blue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 18,
                  borderRadius: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 16,
                        letterSpacing: 0.3,
                      }}
                    >
                      Verify & Sign In
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── resend / back ── */}
          <Animated.View
            entering={FadeIn.duration(500).delay(650)}
            style={{ alignItems: "center", gap: 16 }}
          >
            <Pressable
              hitSlop={8}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="refresh-outline" size={16} color={C.indigo} />
              <Text
                style={{ color: C.indigo, fontSize: 14, fontWeight: "600" }}
              >
                Resend code
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="arrow-back" size={14} color={C.muted} />
              <Text style={{ color: C.muted, fontSize: 14 }}>
                Back to sign in
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
