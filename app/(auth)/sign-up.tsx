import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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
  indigoDark: "#4f46e5",
  violet: "#7c3aed",
  blue: "#38bdf8",
  emerald: "#22c55e",
  rose: "#f43f5e",
  text: "#e8f0fa",
  muted: "#5e7490",
  dim: "#1a2d42",
};

export default function SignUpScreen() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);

  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    if (!input.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 4) {
      setError("Please enter a password (min 4 chars).");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp.create({ emailAddress: input, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      router.replace("/(auth)/sign-in");
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        "Failed to sign up. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !input || !password;

  /* ── password strength indicator ── */
  const getStrength = () => {
    if (!password) return { level: 0, label: "", color: C.dim };
    if (password.length < 6) return { level: 1, label: "Weak", color: C.rose };
    if (password.length < 10)
      return { level: 2, label: "Fair", color: "#f59e0b" };
    return { level: 3, label: "Strong", color: C.emerald };
  };
  const strength = getStrength();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── decorative orbs ── */}
      <Animated.View
        entering={FadeIn.duration(1500)}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <View
          style={{
            position: "absolute",
            top: -60,
            left: -70,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "rgba(56,189,248,0.06)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -80,
            right: -50,
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: "rgba(99,92,241,0.07)",
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
              colors={[C.blue, C.indigo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: C.blue,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <Ionicons name="person-add" size={28} color="#fff" />
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
              Create Account
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(320)}
            style={{ marginBottom: 32 }}
          >
            <Text
              style={{
                fontSize: 15,
                color: C.muted,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Join SmartMettr and start tracking energy
            </Text>
          </Animated.View>

          {/* ── email input ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            style={{ marginBottom: 14 }}
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
              Email
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.surface2,
                borderWidth: 1.5,
                borderColor: emailFocused ? C.indigo : C.dim,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === "ios" ? 16 : 12,
                gap: 12,
              }}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailFocused ? C.indigo : C.muted}
              />
              <TextInput
                style={{ flex: 1, color: C.text, fontSize: 16 }}
                placeholder="you@email.com"
                placeholderTextColor={C.muted}
                value={input}
                onChangeText={(t) => {
                  setError(null);
                  setInput(t);
                }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!loading}
              />
            </View>
          </Animated.View>

          {/* ── password input ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(480)}
            style={{ marginBottom: 6 }}
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
              Password
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.surface2,
                borderWidth: 1.5,
                borderColor: passwordFocused ? C.indigo : C.dim,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === "ios" ? 16 : 12,
                gap: 12,
              }}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? C.indigo : C.muted}
              />
              <TextInput
                ref={passwordRef}
                style={{ flex: 1, color: C.text, fontSize: 16 }}
                placeholder="Min 4 characters"
                placeholderTextColor={C.muted}
                value={password}
                onChangeText={(t) => {
                  setError(null);
                  setPassword(t);
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
                editable={!loading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={C.muted}
                />
              </Pressable>
            </View>
          </Animated.View>

          {/* ── strength meter ── */}
          {password.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{ marginBottom: 20, marginTop: 8, paddingHorizontal: 4 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor:
                        i <= strength.level ? strength.color : C.dim,
                    }}
                  />
                ))}
              </View>
              <Text
                style={{
                  color: strength.color,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {strength.label}
              </Text>
            </Animated.View>
          )}

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
                marginBottom: 16,
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

          {/* ── sign up button ── */}
          <Animated.View entering={FadeInDown.duration(600).delay(580)}>
            <Pressable
              onPress={handleSignUp}
              disabled={disabled}
              style={({ pressed }) => ({
                borderRadius: 14,
                overflow: "hidden",
                opacity: disabled ? 0.5 : 1,
                transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
                shadowColor: C.indigo,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: disabled ? 0 : 0.4,
                shadowRadius: 14,
                elevation: disabled ? 0 : 10,
                marginBottom: 16,
                marginTop: password.length > 0 ? 0 : 14,
              })}
            >
              <LinearGradient
                colors={[C.blue, C.indigo]}
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
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 16,
                        letterSpacing: 0.3,
                      }}
                    >
                      Create Account
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── divider ── */}
          <Animated.View
            entering={FadeIn.duration(500).delay(680)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
              gap: 12,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: C.dim }} />
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: "500" }}>
              OR
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: C.dim }} />
          </Animated.View>

          {/* ── sign in link ── */}
          <Animated.View
            entering={FadeIn.duration(500).delay(780)}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text style={{ color: C.muted, fontSize: 14 }}>
              Already have an account?
            </Text>
            <Pressable
              onPress={() => router.push("/sign-in" as any)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text
                style={{ color: C.indigo, fontSize: 14, fontWeight: "700" }}
              >
                Sign In
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
