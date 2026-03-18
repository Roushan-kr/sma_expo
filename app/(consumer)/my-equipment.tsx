import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { apiRequest } from "@/api/common/apiRequest";
import { useStableToken } from "@/hooks/useStableToken";

const C = {
  bg: "#040a1a",
  surface: "#0b1a2f",
  surface2: "#142840",
  indigo: "#635cf1",
  blue: "#38bdf8",
  emerald: "#22c55e",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "#e8f0fa",
  muted: "#5e7490",
  dim: "#1a2d42",
};

export default function MyEquipmentScreen() {
  const getToken = useStableToken();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchEquipment = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const token = await getToken();
      const res = await apiRequest<any>("/api/equipment/my-equipment", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipment(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Failed to load equipment", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const filtered = equipment.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading && !refreshing) {
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
        <Text style={{ color: C.muted, fontSize: 13 }}>Loading equipment…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEquipment(true)}
            tintColor={C.indigo}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <Animated.View
              entering={FadeInDown.duration(400).delay(100)}
              style={{ marginBottom: 16 }}
            >
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "800",
                  color: C.text,
                  letterSpacing: -0.5,
                }}
              >
                My Equipment
              </Text>
              <Text style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                {equipment.length} device{equipment.length !== 1 ? "s" : ""}{" "}
                connected
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(400).delay(180)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.surface2,
                borderWidth: 1.5,
                borderColor: searchFocused ? C.indigo : C.dim,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: Platform.OS === "ios" ? 14 : 10,
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={searchFocused ? C.indigo : C.muted}
              />
              <TextInput
                placeholder="Search equipment..."
                placeholderTextColor={C.muted}
                value={search}
                onChangeText={setSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{ flex: 1, color: C.text, fontSize: 15 }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={C.muted} />
                </Pressable>
              )}
            </Animated.View>
          </View>
        }
        renderItem={({ item, index }) => {
          const isOp = item.status === "OPERATIONAL";
          const color = isOp ? C.emerald : C.rose;
          return (
            <Animated.View
              entering={FadeInDown.duration(350).delay(100 + index * 40)}
              style={{ paddingHorizontal: 20 }}
            >
              <View
                style={{
                  backgroundColor: C.surface,
                  borderRadius: 18,
                  padding: 18,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: C.dim,
                  borderLeftWidth: 3,
                  borderLeftColor: color,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: `${color}14`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="hardware-chip-outline"
                    size={22}
                    color={color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: C.text,
                      fontSize: 15,
                      fontWeight: "700",
                      marginBottom: 4,
                    }}
                  >
                    {item.name}
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
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons name="flash-outline" size={12} color={C.blue} />
                      <Text style={{ color: C.muted, fontSize: 12 }}>
                        {item.energyConsumed.toFixed(2)} kW
                      </Text>
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: `${color}14`,
                    borderWidth: 1,
                    borderColor: `${color}25`,
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
                      backgroundColor: color,
                    }}
                  />
                  <Text
                    style={{
                      color,
                      fontSize: 10,
                      fontWeight: "800",
                    }}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", padding: 60 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: "rgba(56,189,248,0.06)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="hardware-chip-outline" size={36} color={C.dim} />
            </View>
            <Text style={{ color: C.muted, fontSize: 15 }}>
              {search ? "No equipment matches" : "No equipment found"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
