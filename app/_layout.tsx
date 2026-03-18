import "../global.css";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/token-cache";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { PaperProvider } from "react-native-paper";

import { useColorScheme } from "@/hooks/use-color-scheme";
import FlashMessage from "react-native-flash-message";
import ErrorBoundary from "react-native-error-boundary";
import { View, Text, Pressable } from "react-native";
import { AuthHandler } from "@/components/auth/AuthHandler";
import { Ionicons } from "@expo/vector-icons";

/* ────────────────────────────────────────────
 *  Error Fallback
 * ──────────────────────────────────────────── */
const ErrorFallback = (props: { error: Error; resetError: () => void }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: "#030712",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}
  >
    {/* icon */}
    <View
      style={{
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: "rgba(239,68,68,0.07)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.12)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
      }}
    >
      <Ionicons name="warning-outline" size={38} color="#f87171" />
    </View>

    <Text
      style={{
        color: "#f1f5f9",
        fontSize: 24,
        fontWeight: "800",
        marginBottom: 10,
        textAlign: "center",
        letterSpacing: -0.5,
      }}
    >
      Something went wrong
    </Text>

    <Text
      style={{
        color: "#64748b",
        textAlign: "center",
        marginBottom: 32,
        fontSize: 15,
        lineHeight: 24,
        paddingHorizontal: 16,
      }}
    >
      We encountered an unexpected error.{"\n"}Our team has been notified.
    </Text>

    <Pressable
      onPress={props.resetError}
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#4f46e5" : "#6366f1",
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 10,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Ionicons name="refresh" size={18} color="#fff" />
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
        Try Again
      </Text>
    </Pressable>

    {/* dev-only error detail */}
    {__DEV__ && props.error?.message ? (
      <View
        style={{
          marginTop: 36,
          backgroundColor: "rgba(239,68,68,0.05)",
          borderRadius: 12,
          padding: 16,
          width: "100%",
          borderWidth: 1,
          borderColor: "rgba(239,68,68,0.1)",
        }}
      >
        <Text
          style={{
            color: "#64748b",
            fontSize: 10,
            fontWeight: "700",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Error Details
        </Text>
        <Text
          style={{
            color: "#f87171",
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          {props.error.message}
        </Text>
      </View>
    ) : null}
  </View>
);

/* ────────────────────────────────────────────
 *  Clerk
 * ──────────────────────────────────────────── */
const CLERK_PUBLISHABLE_KEY = process.env
  .EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables.",
  );
}

/* ────────────────────────────────────────────
 *  Layout
 * ──────────────────────────────────────────── */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
      >
        <ClerkLoaded>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <PaperProvider>
              <AuthHandler>
                <Stack
                  screenOptions={{
                    contentStyle: { backgroundColor: "#030712" },
                    animation: "fade",
                  }}
                >
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(consumer)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(admin)"
                    options={{ headerShown: false }}
                  />
                </Stack>
              </AuthHandler>
              <StatusBar style="light" />
              <FlashMessage position="top" />
            </PaperProvider>
          </ThemeProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
