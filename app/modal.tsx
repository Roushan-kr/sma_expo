import { Link, useRouter } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { SlideInDown, FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
    >
      <Animated.View
        entering={SlideInDown.springify().damping(16).stiffness(140)}
        style={{
          backgroundColor: "#1e293b",
          borderRadius: 24,
          padding: 32,
          width: "100%",
          maxWidth: 380,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "rgba(51,65,85,0.5)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.4,
          shadowRadius: 28,
          elevation: 24,
        }}
      >
        {/* close button */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({
            position: "absolute",
            top: 14,
            right: 14,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: pressed
              ? "rgba(51,65,85,0.9)"
              : "rgba(51,65,85,0.5)",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Ionicons name="close" size={18} color="#94a3b8" />
        </Pressable>

        {/* icon */}
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: "rgba(99,102,241,0.1)",
            borderWidth: 1,
            borderColor: "rgba(99,102,241,0.18)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <Ionicons name="information-circle" size={34} color="#818cf8" />
        </View>

        <Text
          style={{
            color: "#f1f5f9",
            fontSize: 22,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          Information
        </Text>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 15,
            textAlign: "center",
            marginBottom: 28,
            lineHeight: 23,
            paddingHorizontal: 8,
          }}
        >
          This is a modal dialog. Use the button below to navigate back to the
          home screen.
        </Text>

        <Link href="/" dismissTo asChild>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#4f46e5" : "#6366f1",
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              shadowColor: "#6366f1",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            <Ionicons name="home-outline" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
              Go to Home
            </Text>
          </Pressable>
        </Link>
      </Animated.View>
    </Animated.View>
  );
}
