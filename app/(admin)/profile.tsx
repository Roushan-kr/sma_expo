import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
} from "react-native-reanimated";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUser as useClerkUser } from "@clerk/clerk-expo";
import { useLogout } from "@/hooks/useLogout";

const C = {
  bg: "#040a1a",
  surface: "#0b1a2f",
  surface2: "#142840",
  indigo: "#635cf1",
  violet: "#7c3aed",
  blue: "#38bdf8",
  emerald: "#22c55e",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "#e8f0fa",
  muted: "#5e7490",
  dim: "#1a2d42",
};

function InfoRow({
  label,
  value,
  iconName,
  mono,
  delay = 0,
}: {
  label: string;
  value: string;
  iconName: keyof typeof Ionicons.glyphMap;
  mono?: boolean;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      style={{ marginBottom: 12 }}
    >
      <Text
        style={{
          color: C.muted,
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 8,
          marginLeft: 4,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: C.surface2,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderWidth: 1,
          borderColor: C.dim,
          gap: 12,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: "rgba(99,92,241,0.08)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={iconName} size={16} color={C.indigo} />
        </View>
        <Text
          style={{
            flex: 1,
            color: C.text,
            fontSize: mono ? 12 : 14,
            fontWeight: "500",
            fontFamily: mono ? "monospace" : undefined,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </Animated.View>
  );
}

function JurisdictionCard({
  label,
  roleLabel,
  id,
  iconName,
  accent,
  delay = 0,
}: {
  label: string;
  roleLabel: string;
  id: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accent: string;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      style={{ marginBottom: 12 }}
    >
      <Text
        style={{
          color: C.muted,
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 8,
          marginLeft: 4,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: C.surface2,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderWidth: 1,
          borderColor: C.dim,
          borderLeftWidth: 3,
          borderLeftColor: accent,
          gap: 12,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: `${accent}14`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={iconName} size={16} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontSize: 14, fontWeight: "600" }}>
            {roleLabel}
          </Text>
          <Text
            style={{
              color: C.muted,
              fontSize: 11,
              fontFamily: "monospace",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {id}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function AdminProfileScreen() {
  const { handleLogout } = useLogout();
  const { user: clerkUser } = useClerkUser();
  const { profile, loading, error } = useAuthStore();

  if (loading && !profile) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.bg,
        }}
      >
        <Animated.View entering={ZoomIn.springify()}>
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              backgroundColor: "rgba(99,92,241,0.08)",
              borderWidth: 1,
              borderColor: "rgba(99,92,241,0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <ActivityIndicator size="large" color={C.indigo} />
          </View>
        </Animated.View>
        <Animated.Text
          entering={FadeIn.delay(300)}
          style={{ color: C.muted, fontSize: 13 }}
        >
          Loading profile…
        </Animated.Text>
      </View>
    );
  }

  const displayName = profile?.name ?? clerkUser?.fullName ?? "Admin";
  const displayEmail =
    (profile as any)?.email ??
    clerkUser?.primaryEmailAddress?.emailAddress ??
    "N/A";
  const displayRole = (profile as any)?.role ?? "ADMIN";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Error banner ── */}
        {error && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{
              marginHorizontal: 20,
              marginTop: 16,
              flexDirection: "row",
              alignItems: "flex-start",
              backgroundColor: "rgba(244,63,94,0.06)",
              borderWidth: 1,
              borderColor: "rgba(244,63,94,0.15)",
              borderRadius: 14,
              padding: 14,
              gap: 10,
            }}
          >
            <Ionicons name="alert-circle" size={18} color={C.rose} />
            <Text style={{ color: C.rose, fontSize: 13, flex: 1, lineHeight: 20 }}>
              {error}
            </Text>
          </Animated.View>
        )}

        {/* ── Avatar section ── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100).springify()}
          style={{ alignItems: "center", paddingTop: 28, paddingBottom: 8 }}
        >
          <View style={{ position: "relative", marginBottom: 18 }}>
            <LinearGradient
              colors={[C.indigo, C.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 88,
                height: 88,
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: C.indigo,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 34, fontWeight: "800" }}>
                {initial}
              </Text>
            </LinearGradient>
            {/* online dot */}
            <View
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: C.bg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: C.emerald,
                }}
              />
            </View>
          </View>

          <Text
            style={{
              color: C.text,
              fontSize: 24,
              fontWeight: "800",
              letterSpacing: -0.5,
              marginBottom: 8,
            }}
          >
            {displayName}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(99,92,241,0.1)",
                borderWidth: 1,
                borderColor: "rgba(99,92,241,0.2)",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  color: C.indigo,
                  fontSize: 11,
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {displayRole.replace("_", " ")}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "rgba(34,197,94,0.1)",
                borderWidth: 1,
                borderColor: "rgba(34,197,94,0.2)",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: C.emerald,
                }}
              />
              <Text
                style={{
                  color: C.emerald,
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                Active
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Info fields ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <Animated.View entering={FadeIn.delay(250)}>
            <Text
              style={{
                color: C.muted,
                fontSize: 11,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 16,
              }}
            >
              Account Details
            </Text>
          </Animated.View>

          <InfoRow
            label="Email Address"
            value={displayEmail}
            iconName="mail-outline"
            delay={300}
          />
          <InfoRow
            label="Account ID"
            value={profile?.id ?? "N/A"}
            iconName="finger-print-outline"
            mono
            delay={380}
          />

          {profile?.stateId && (
            <JurisdictionCard
              label="Jurisdiction"
              roleLabel="State Admin"
              id={profile.stateId}
              iconName="map-outline"
              accent={C.blue}
              delay={460}
            />
          )}

          {profile?.boardId && (
            <JurisdictionCard
              label="Utility Board"
              roleLabel="Board Admin"
              id={profile.boardId}
              iconName="business-outline"
              accent={C.emerald}
              delay={540}
            />
          )}
        </View>

        {/* ── Info notice ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(600)}
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            flexDirection: "row",
            alignItems: "flex-start",
            backgroundColor: "rgba(56,189,248,0.05)",
            borderWidth: 1,
            borderColor: "rgba(56,189,248,0.1)",
            borderRadius: 14,
            padding: 14,
            gap: 10,
          }}
        >
          <Ionicons name="information-circle" size={18} color={C.blue} />
          <Text
            style={{ color: C.muted, fontSize: 12, flex: 1, lineHeight: 19 }}
          >
            Profile management for admins is handled via the state/board
            management portal.
          </Text>
        </Animated.View>

        {/* ── Sign out ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(700)}
          style={{ paddingHorizontal: 20, marginTop: 28 }}
        >
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              backgroundColor: pressed
                ? "rgba(244,63,94,0.12)"
                : "rgba(244,63,94,0.06)",
              borderWidth: 1,
              borderColor: "rgba(244,63,94,0.15)",
              borderRadius: 16,
              paddingVertical: 16,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Ionicons name="log-out-outline" size={20} color={C.rose} />
            <Text style={{ color: C.rose, fontWeight: "700", fontSize: 15 }}>
              Sign Out
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── Footer ── */}
        <Animated.View
          entering={FadeIn.delay(800)}
          style={{ alignItems: "center", marginTop: 28, paddingBottom: 8 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons name="shield-checkmark" size={12} color={C.dim} />
            <Text style={{ color: C.dim, fontSize: 11, fontWeight: "500" }}>
              Secured admin session
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}