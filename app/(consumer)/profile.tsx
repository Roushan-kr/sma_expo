import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
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
import { useStableToken } from "@/hooks/useStableToken";
import { apiRequest } from "@/api/common/apiRequest";
import { useLogout } from "@/hooks/useLogout";

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

export default function ConsumerProfileScreen() {
  const { handleLogout } = useLogout();
  const getToken = useStableToken();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    updateProfile,
  } = useAuthStore();

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phoneNumber: "" });
  const [meters, setMeters] = useState<any[]>([]);
  const [metersLoading, setMetersLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        name: (profile as any).name ?? "",
        address: (profile as any).address ?? "",
        phoneNumber: (profile as any).phoneNumber ?? "",
      });
    }
  }, [profile]);

  const loadMeters = useCallback(async () => {
    setMetersLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await apiRequest<any>("/api/smart-meters/my-meters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = res.data;
      if (data && Array.isArray(data.data)) data = data.data;
      setMeters(Array.isArray(data) ? data : []);
    } catch {
    } finally {
      setMetersLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadMeters();
  }, [loadMeters]);

  const handleSave = async () => {
    const token = await getToken();
    if (!token) return;
    await updateProfile(form, token);
    setEdit(false);
    Alert.alert("Success", "Profile updated successfully.");
  };

  if (profileLoading && !profile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          alignItems: "center",
          justifyContent: "center",
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
      </View>
    );
  }

  const initial = (form.name || "C").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {profileError && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              backgroundColor: "rgba(244,63,94,0.06)",
              borderWidth: 1,
              borderColor: "rgba(244,63,94,0.15)",
              borderRadius: 14,
              padding: 14,
              gap: 10,
              marginBottom: 18,
            }}
          >
            <Ionicons name="alert-circle" size={18} color={C.rose} />
            <Text
              style={{ color: C.rose, fontSize: 13, flex: 1, lineHeight: 20 }}
            >
              {profileError}
            </Text>
          </Animated.View>
        )}

        {/* Avatar */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100).springify()}
          style={{ alignItems: "center", marginBottom: 28 }}
        >
          <LinearGradient
            colors={[C.blue, C.indigo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
              shadowColor: C.blue,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 14,
              elevation: 10 as any,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 30, fontWeight: "800" }}>
              {initial}
            </Text>
          </LinearGradient>
          <Text
            style={{
              color: C.text,
              fontSize: 22,
              fontWeight: "800",
              letterSpacing: -0.3,
            }}
          >
            {form.name || "Consumer"}
          </Text>
        </Animated.View>

        {/* Personal Info */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={{
            backgroundColor: C.surface,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: C.dim,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <Ionicons name="person-outline" size={16} color={C.indigo} />
            <Text
              style={{
                color: C.indigo,
                fontSize: 11,
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Personal Information
            </Text>
          </View>

          {(
            [
              {
                key: "name",
                label: "Full Name",
                icon: "person-outline",
                editable: edit,
              },
              {
                key: "address",
                label: "Service Address",
                icon: "location-outline",
                editable: edit,
                multiline: true,
              },
              {
                key: "phoneNumber",
                label: "Registered Phone",
                icon: "call-outline",
                editable: false,
                note: "Phone number cannot be changed here.",
              },
            ] as {
              key: keyof typeof form;
              label: string;
              icon: keyof typeof Ionicons.glyphMap;
              editable: boolean;
              multiline?: boolean;
              note?: string;
            }[]
          ).map((field, idx) => (
            <View key={field.key} style={{ marginBottom: 14 }}>
              <Text
                style={{
                  color: C.muted,
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                {field.label}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: field.multiline ? "flex-start" : "center",
                  backgroundColor: C.surface2,
                  borderWidth: 1.5,
                  borderColor:
                    focusedField === field.key
                      ? C.indigo
                      : field.editable
                        ? "rgba(99,92,241,0.2)"
                        : C.dim,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: Platform.OS === "ios" ? 14 : 10,
                  gap: 10,
                  opacity: field.editable || !edit ? 1 : 0.5,
                }}
              >
                <Ionicons
                  name={field.icon as any}
                  size={18}
                  color={
                    focusedField === field.key ? C.indigo : C.muted
                  }
                  style={field.multiline ? { marginTop: 4 } : {}}
                />
                <TextInput
                  style={{
                    flex: 1,
                    color: C.text,
                    fontSize: 15,
                    minHeight: field.multiline ? 80 : undefined,
                  }}
                  value={form[field.key]}
                  editable={field.editable}
                  multiline={field.multiline}
                  textAlignVertical={field.multiline ? "top" : "center"}
                  onChangeText={(t) =>
                    setForm((f) => ({ ...f, [field.key]: t }))
                  }
                  onFocus={() => setFocusedField(field.key)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={field.label}
                  placeholderTextColor={C.muted}
                />
              </View>
              {field.note && (
                <Text
                  style={{
                    color: C.dim,
                    fontSize: 10,
                    marginTop: 4,
                    marginLeft: 4,
                  }}
                >
                  {field.note}
                </Text>
              )}
            </View>
          ))}

          {/* Edit/Save buttons */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
            {edit ? (
              <>
                <Pressable
                  onPress={() => setEdit(false)}
                  disabled={profileLoading}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: pressed ? C.surface2 : C.surface,
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: C.dim,
                  })}
                >
                  <Text
                    style={{ color: C.text, fontWeight: "700", fontSize: 14 }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={profileLoading}
                  style={({ pressed }) => ({
                    flex: 1,
                    borderRadius: 14,
                    overflow: "hidden",
                    opacity: profileLoading ? 0.5 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }] as any,
                  })}
                >
                  <LinearGradient
                    colors={[C.indigo, C.violet]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: "center",
                    }}
                  >
                    {profileLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        Save
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => setEdit(true)}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed
                    ? "rgba(99,92,241,0.12)"
                    : "rgba(99,92,241,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(99,92,241,0.2)",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                })}
              >
                <Ionicons name="create-outline" size={18} color={C.indigo} />
                <Text
                  style={{ color: C.indigo, fontWeight: "700", fontSize: 14 }}
                >
                  Edit Details
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Meters */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 4,
                height: 18,
                borderRadius: 2,
                backgroundColor: C.blue,
              }}
            />
            <Text
              style={{ color: C.text, fontSize: 18, fontWeight: "800" }}
            >
              My Meters & Tariffs
            </Text>
          </View>
        </Animated.View>

        {metersLoading ? (
          <ActivityIndicator color={C.indigo} />
        ) : meters.length === 0 ? (
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 18,
              padding: 28,
              alignItems: "center",
              borderWidth: 1,
              borderColor: C.dim,
              gap: 10,
            }}
          >
            <Ionicons name="speedometer-outline" size={32} color={C.dim} />
            <Text style={{ color: C.muted, fontSize: 14 }}>
              No meters linked to your account
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {meters.map((meter, idx) => {
              const isActive = meter.status === "ACTIVE";
              const statusColor = isActive ? C.emerald : C.rose;
              return (
                <Animated.View
                  key={meter.id}
                  entering={FadeInDown.duration(350).delay(400 + idx * 50)}
                >
                  <View
                    style={{
                      backgroundColor: C.surface,
                      borderRadius: 18,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: C.dim,
                    }}
                  >
                    {/* Header */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: C.dim,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 11,
                            backgroundColor: `${statusColor}14`,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name="speedometer-outline"
                            size={18}
                            color={statusColor}
                          />
                        </View>
                        <View>
                          <Text
                            style={{
                              color: C.text,
                              fontSize: 16,
                              fontWeight: "800",
                              fontFamily: "monospace",
                              letterSpacing: 1,
                            }}
                          >
                            {meter.meterNumber}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                          backgroundColor: `${statusColor}14`,
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: statusColor,
                          }}
                        />
                        <Text
                          style={{
                            color: statusColor,
                            fontSize: 10,
                            fontWeight: "800",
                          }}
                        >
                          {meter.status}
                        </Text>
                      </View>
                    </View>

                    {/* Tariff */}
                    {meter.tariff ? (
                      <View style={{ padding: 16, gap: 10 }}>
                        {[
                          {
                            label: "Category",
                            value: meter.tariff.type,
                            color: C.text,
                          },
                          {
                            label: "Unit Rate",
                            value: `₹${meter.tariff.unitRate?.toFixed(2)} / kWh`,
                            color: C.emerald,
                          },
                          {
                            label: "Fixed Charge",
                            value: `₹${meter.tariff.fixedCharge?.toFixed(2)}`,
                            color: C.text,
                          },
                        ].map((row) => (
                          <View
                            key={row.label}
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: C.muted,
                                fontSize: 13,
                              }}
                            >
                              {row.label}
                            </Text>
                            <Text
                              style={{
                                color: row.color,
                                fontSize: 14,
                                fontWeight: "700",
                              }}
                            >
                              {row.value}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={{ padding: 16 }}>
                        <Text
                          style={{
                            color: C.dim,
                            fontSize: 13,
                            fontStyle: "italic",
                          }}
                        >
                          No active tariff plan
                        </Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Sign Out */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(550)}
          style={{ marginTop: 32 }}
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
              transform: [{ scale: pressed ? 0.97 : 1 }] as any,
            })}
          >
            <Ionicons name="log-out-outline" size={20} color={C.rose} />
            <Text style={{ color: C.rose, fontWeight: "700", fontSize: 15 }}>
              Sign Out
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
