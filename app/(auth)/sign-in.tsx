import { useSignIn } from "@clerk/clerk-expo";
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
  rose: "#f43f5e",
  text: "#e8f0fa",
  muted: "#5e7490",
  dim: "#1a2d42",
};

export default function SignInScreen() {
  const { signIn, isLoaded } = useSignIn();
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

  const handleSend = async () => {
    if (!isLoaded) return;
    if (!input.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 4) {
      setError("Please enter your password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: input,
        password,
        strategy: "password",
      });
      if (result.status === "complete") {
        router.replace("/"); // go to root `index.tsx` where role is verified
      } else if (result.status === "needs_second_factor") {
        await signIn.prepareSecondFactor({ strategy: "email_code" });
        router.push("/verify" as any);
      } else {
        setError("Unexpected sign-in status: " + result.status);
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        "Failed to sign in. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !input || !password;

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
            top: -80,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: "rgba(99,92,241,0.08)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -100,
            left: -80,
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: "rgba(56,189,248,0.05)",
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
              colors={[C.indigo, C.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: C.indigo,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <Ionicons name="lock-closed" size={28} color="#fff" />
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
              Welcome back
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
              Sign in to your SmartMettr account
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
                placeholder="Enter your password"
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
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleSend}
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

          {/* ── forgot password ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(520)}
            style={{ alignItems: "flex-end", marginBottom: 20 }}
          >
            <Pressable
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text
                style={{ color: C.indigo, fontSize: 13, fontWeight: "600" }}
              >
                Forgot password?
              </Text>
            </Pressable>
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

          {/* ── sign in button ── */}
          <Animated.View entering={FadeInDown.duration(600).delay(600)}>
            <Pressable
              onPress={handleSend}
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
              })}
            >
              <LinearGradient
                colors={[C.indigo, C.violet]}
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
                      Sign In
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── divider ── */}
          <Animated.View
            entering={FadeIn.duration(500).delay(700)}
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

          {/* ── sign up link ── */}
          <Animated.View
            entering={FadeIn.duration(500).delay(800)}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text style={{ color: C.muted, fontSize: 14 }}>
              Don't have an account?
            </Text>
            <Pressable
              onPress={() => router.push("/sign-up" as any)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text
                style={{ color: C.indigo, fontSize: 14, fontWeight: "700" }}
              >
                Sign Up
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
