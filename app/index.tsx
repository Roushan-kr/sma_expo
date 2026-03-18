import {
  View,
  Text,
  Pressable,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const FEATURES = [
  { icon: "flash" as const, label: "Real-time", color: "#fbbf24" },
  { icon: "shield-checkmark" as const, label: "Secure", color: "#34d399" },
  { icon: "sparkles" as const, label: "AI Powered", color: "#a78bfa" },
];

export default function LandingPage() {
  const { user } = useUser();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const { isLoaded: storeLoaded } = useAuthStore();
  const insets = useSafeAreaInsets();

  /* ── animations ── */
  const pulse = useSharedValue(1);
  const orbGlow = useSharedValue(0.3);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    orbGlow.value = withRepeat(
      withSequence(
        withTiming(0.55, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.18, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const orbStyle = useAnimatedStyle(() => ({ opacity: orbGlow.value }));

  /* ── auth redirect ── */
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const role = user.publicMetadata?.role as string;
      if (role === "CONSUMER") router.replace("/dashboard" as any);
      else if (role) router.replace("/admin-dashboard" as any);
    }
  }, [isLoaded, isSignedIn, user, router]);

  /* ── loading state ── */
  if (!isLoaded || isSignedIn) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#030712",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.View entering={ZoomIn.springify()}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              backgroundColor: "rgba(99,102,241,0.08)",
              borderWidth: 1,
              borderColor: "rgba(99,102,241,0.18)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <ActivityIndicator size="large" color="#818cf8" />
          </View>
        </Animated.View>
        <Animated.Text
          entering={FadeIn.delay(300)}
          style={{ color: "#64748b", fontSize: 13, letterSpacing: 0.5 }}
        >
          Preparing your dashboard…
        </Animated.Text>
      </View>
    );
  }

  /* ── main screen ── */
  return (
    <View style={{ flex: 1, backgroundColor: "#030712" }}>
      {/* ── decorative background ── */}
      <Animated.View
        entering={FadeIn.duration(2000)}
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            orbStyle,
            {
              position: "absolute",
              top: -60,
              right: -50,
              width: 260,
              height: 260,
              borderRadius: 130,
              backgroundColor: "rgba(99,102,241,0.14)",
            },
          ]}
        />
        <Animated.View
          style={[
            orbStyle,
            {
              position: "absolute",
              bottom: -90,
              left: -70,
              width: 320,
              height: 320,
              borderRadius: 160,
              backgroundColor: "rgba(139,92,246,0.09)",
            },
          ]}
        />
        {/* tiny accent dots */}
        {/* tiny accent dots */}
        <View
          style={{
            position: "absolute",
            top: "28%",
            left: 28,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(139,92,246,0.4)",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: "20%",
            right: 44,
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: "rgba(139,92,246,0.5)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: "32%",
            right: 20,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: "rgba(139,92,246,0.25)",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: "52%",
            left: 56,
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: "rgba(139,92,246,0.3)",
          }}
        />
      </Animated.View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── logo ── */}
        <Animated.View
          entering={FadeInDown.duration(700).delay(200).springify()}
          style={{ alignItems: "center", marginBottom: 28 }}
        >
          <Animated.View style={pulseStyle}>
            <LinearGradient
              colors={["#6366f1", "#8b5cf6", "#a78bfa"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 88,
                height: 88,
                borderRadius: 26,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#6366f1",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 24,
                elevation: 18,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 34,
                  fontWeight: "800",
                  letterSpacing: -1,
                }}
              >
                SM
              </Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* ── title ── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(350)}
          style={{ alignItems: "center", marginBottom: 6 }}
        >
          <Text
            style={{
              fontSize: 44,
              fontWeight: "800",
              color: "#fff",
              textAlign: "center",
              letterSpacing: -1.5,
            }}
          >
            Smart
            <Text style={{ color: "#818cf8" }}>Mettr</Text>
          </Text>
        </Animated.View>

        {/* ── subtitle ── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(450)}
          style={{ alignItems: "center", marginBottom: 28 }}
        >
          <Text
            style={{
              fontSize: 17,
              color: "#94a3b8",
              textAlign: "center",
              fontWeight: "500",
              lineHeight: 26,
              paddingHorizontal: 12,
            }}
          >
            Next-gen IoT energy management{"\n"}powered by artificial
            intelligence
          </Text>
        </Animated.View>

        {/* ── feature pills ── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(550)}
          style={{
            flexDirection: "row",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {FEATURES.map((f, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(30,41,59,0.7)",
                borderWidth: 1,
                borderColor: "rgba(51,65,85,0.5)",
                borderRadius: 100,
                paddingHorizontal: 14,
                paddingVertical: 10,
                gap: 6,
              }}
            >
              <Ionicons name={f.icon} size={14} color={f.color} />
              <Text
                style={{ color: "#cbd5e1", fontSize: 13, fontWeight: "600" }}
              >
                {f.label}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* ── info card ── */}
        <Animated.View entering={FadeInDown.duration(600).delay(650)}>
          <View
            style={{
              backgroundColor: "rgba(15,23,42,0.85)",
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: "rgba(30,41,59,0.8)",
              marginBottom: 36,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 14,
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <LinearGradient
                colors={["rgba(99,102,241,0.14)", "rgba(139,92,246,0.14)"]}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="bulb-outline" size={20} color="#818cf8" />
              </LinearGradient>
              <Text
                style={{ color: "#f1f5f9", fontWeight: "700", fontSize: 16 }}
              >
                Why SmartMettr?
              </Text>
            </View>
            <Text style={{ color: "#94a3b8", fontSize: 15, lineHeight: 24 }}>
              Seamless energy tracking, transparent billing, and automated
              support issue resolution — all enhanced by intelligent AI agents
              that work around the clock.
            </Text>
          </View>
        </Animated.View>

        {/* ── CTA buttons ── */}
        <Animated.View
          entering={FadeInUp.duration(700).delay(800)}
          style={{ gap: 14 }}
        >
          {/* primary */}
          <Pressable
            onPress={() => router.push("/sign-up" as any)}
            style={({ pressed }) => ({
              borderRadius: 16,
              overflow: "hidden",
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: "#6366f1",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.45,
              shadowRadius: 18,
              elevation: 14,
            })}
          >
            <LinearGradient
              colors={["#6366f1", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18,
                borderRadius: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: 17,
                  letterSpacing: 0.3,
                }}
              >
                Get Started
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>

          {/* secondary */}
          <Pressable
            onPress={() => router.push("/sign-in" as any)}
            style={({ pressed }) => ({
              width: "100%",
              backgroundColor: pressed
                ? "rgba(30,41,59,0.9)"
                : "rgba(30,41,59,0.5)",
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(51,65,85,0.6)",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Ionicons name="log-in-outline" size={20} color="#c7d2fe" />
            <Text
              style={{
                color: "#c7d2fe",
                fontWeight: "600",
                fontSize: 17,
                letterSpacing: 0.3,
              }}
            >
              Sign In
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── trust footer ── */}
        <Animated.View
          entering={FadeIn.duration(800).delay(1100)}
          style={{ alignItems: "center", marginTop: 28, paddingBottom: 8 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <Ionicons name="lock-closed" size={12} color="#475569" />
            <Text style={{ color: "#475569", fontSize: 12, fontWeight: "500" }}>
              Secured with end-to-end encryption
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
