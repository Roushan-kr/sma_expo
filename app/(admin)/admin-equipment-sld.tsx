import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  ScrollView,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Text,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInDown,
  ZoomIn,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/api/common/apiRequest";
import { useStableToken } from "@/hooks/useStableToken";
import EquipmentNode from "@/components/sld/EquipmentNode";

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

const NODE_WIDTH = 180;
const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 100;
const ROOT_WIDTH = 250;
const ROOT_HEIGHT = 60;
const CANVAS_PADDING = 40;
const BUS_OFFSET = 40;

export default function AdminEquipmentSLDScreen() {
  const getToken = useStableToken();

  const [loading, setLoading] = useState(false);
  const [meters, setMeters] = useState<any[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [numColumns, setNumColumns] = useState(2);
  const [isEditMode, setIsEditMode] = useState(false);
  const [meterMenuVisible, setMeterMenuVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    fetchMeters();
  }, []);

  useEffect(() => {
    if (selectedMeterId) fetchEquipment(selectedMeterId);
  }, [selectedMeterId]);

  const fetchMeters = async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<any>("/api/smart-meters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setMeters(data);
      if (data.length > 0) setSelectedMeterId(data[0].id);
    } catch (err) {
      console.error("Failed to load meters", err);
    }
  };

  const fetchEquipment = async (meterId: string) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await apiRequest<any>(`/api/equipment?meterId=${meterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipment(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Failed to load equipment", err);
    } finally {
      setLoading(false);
    }
  };

  const layout = useMemo(() => {
    if (equipment.length === 0)
      return {
        nodes: [],
        connections: [],
        totalWidth: Dimensions.get("window").width,
        totalHeight: 400,
        rootX: 0,
        rootY: 0,
      };

    const totalWidth = Math.max(
      Dimensions.get("window").width,
      numColumns * COLUMN_WIDTH + CANVAS_PADDING * 2
    );
    const rootX = (totalWidth - ROOT_WIDTH) / 2;
    const rootY = CANVAS_PADDING;
    const equipmentStartY = rootY + ROOT_HEIGHT + 60;

    const nodes = equipment.map((eq, index) => {
      const col = index % numColumns;
      const row = Math.floor(index / numColumns);
      const startX = (totalWidth - numColumns * COLUMN_WIDTH) / 2;
      const x = startX + col * COLUMN_WIDTH + (COLUMN_WIDTH - NODE_WIDTH) / 2;
      const y = equipmentStartY + row * ROW_HEIGHT;
      return { equipment: eq, x, y, column: col, row };
    });

    const connections = nodes.map((node) => {
      const startX = rootX + ROOT_WIDTH / 2;
      const startY = rootY + ROOT_HEIGHT;
      const busY = startY + BUS_OFFSET;
      const endX = node.x + NODE_WIDTH / 2;
      const endY = node.y;
      const color =
        node.equipment.status === "OPERATIONAL" ? C.emerald : C.dim;
      return { startX, startY, busY, endX, endY, color };
    });

    const maxRow = Math.floor((equipment.length - 1) / numColumns);
    return {
      nodes,
      connections,
      rootX,
      rootY,
      totalWidth,
      totalHeight: equipmentStartY + (maxRow + 1) * ROW_HEIGHT + 100,
    };
  }, [equipment, numColumns]);

  const getSmoothPath = (
    x1: number,
    y1: number,
    busY: number,
    x2: number,
    y2: number
  ) => {
    const r = 10;
    const xDir = x2 > x1 ? 1 : -1;
    if (Math.abs(x1 - x2) < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;
    return `M ${x1} ${y1} L ${x1} ${busY - r} Q ${x1} ${busY} ${x1 + r * xDir} ${busY} L ${x2 - r * xDir} ${busY} Q ${x2} ${busY} ${x2} ${busY + r} L ${x2} ${y2}`;
  };

  const selectedMeter = meters.find((m) => m.id === selectedMeterId);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Meter Selector ── */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 12,
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
          <Pressable
            onPress={() => setMeterMenuVisible(true)}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: pressed ? C.surface2 : C.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: C.dim,
            })}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: `${C.blue}14`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={16}
                  color={C.blue}
                />
              </View>
              <Text
                style={{ color: C.text, fontSize: 14, fontWeight: "600" }}
              >
                {selectedMeter?.meterNumber ?? "Select Meter"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={C.muted} />
          </Pressable>

          {/* edit toggle */}
          <Pressable
            onPress={() => setIsEditMode(!isEditMode)}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: isEditMode
                ? `${C.indigo}14`
                : pressed
                  ? C.surface2
                  : C.surface,
              borderWidth: 1,
              borderColor: isEditMode ? C.indigo : C.dim,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Ionicons
              name={isEditMode ? "checkmark" : "pencil-outline"}
              size={20}
              color={isEditMode ? C.indigo : C.muted}
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* ── Edit Controls ── */}
      {isEditMode && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: "rgba(99,92,241,0.06)",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(99,92,241,0.1)",
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <Ionicons name="grid-outline" size={16} color={C.indigo} />
            <Text style={{ color: C.indigo, fontWeight: "600", fontSize: 13 }}>
              Columns: {numColumns}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Pressable
              onPress={() => setNumColumns(Math.max(1, numColumns - 1))}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: pressed ? C.surface2 : C.surface,
                borderWidth: 1,
                borderColor: C.dim,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Ionicons name="remove" size={18} color={C.text} />
            </Pressable>
            <Pressable
              onPress={() => setNumColumns(Math.min(4, numColumns + 1))}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: pressed ? C.surface2 : C.surface,
                borderWidth: 1,
                borderColor: C.dim,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Ionicons name="add" size={18} color={C.text} />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* ── Canvas ── */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
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
            <Text style={{ color: C.muted, fontSize: 13 }}>
              Loading diagram…
            </Text>
          </View>
        ) : equipment.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: "rgba(56,189,248,0.06)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="git-network-outline"
                size={40}
                color={C.dim}
              />
            </View>
            <Text
              style={{
                color: C.text,
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              No equipment found
            </Text>
            <Text
              style={{
                color: C.muted,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              This meter has no connected equipment
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                minWidth: layout.totalWidth,
                minHeight: layout.totalHeight,
              }}
            >
              {/* SVG connections */}
              <Svg
                height={layout.totalHeight}
                width={layout.totalWidth}
                style={{ position: "absolute" }}
              >
                {layout.connections.map((conn, i) => (
                  <React.Fragment key={i}>
                    <Path
                      d={getSmoothPath(
                        conn.startX,
                        conn.startY,
                        conn.busY,
                        conn.endX,
                        conn.endY
                      )}
                      stroke={conn.color}
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={
                        conn.color === C.dim ? "6,4" : undefined
                      }
                    />
                    <Circle
                      cx={conn.startX}
                      cy={conn.startY}
                      r="4"
                      fill={conn.color}
                    />
                    <Circle
                      cx={conn.endX}
                      cy={conn.endY}
                      r="3"
                      fill={conn.color}
                    />
                  </React.Fragment>
                ))}
              </Svg>

              {/* Root node */}
              <View
                style={{
                  position: "absolute",
                  left: layout.rootX,
                  top: layout.rootY,
                  width: ROOT_WIDTH,
                  height: ROOT_HEIGHT,
                  zIndex: 40,
                }}
              >
                <LinearGradient
                  colors={[C.surface2, C.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    borderRadius: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    borderWidth: 1.5,
                    borderColor: C.indigo,
                    shadowColor: C.indigo,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: "rgba(99,92,241,0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="speedometer"
                      size={16}
                      color={C.indigo}
                    />
                  </View>
                  <Text
                    style={{
                      color: C.text,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {selectedMeter?.meterNumber ?? "Meter"}
                  </Text>
                </LinearGradient>
              </View>

              {/* Equipment nodes */}
              {layout.nodes.map((node) => (
                <EquipmentNode
                  key={node.equipment.id}
                  node={node}
                  isEditMode={isEditMode}
                  onNodePress={(eq: any) => {
                    setSelectedNode(eq);
                    setDetailsVisible(true);
                  }}
                  onPositionPress={() => {}}
                />
              ))}
            </ScrollView>
          </ScrollView>
        )}
      </View>

      {/* ── Meter Selection Modal ── */}
      <Modal visible={meterMenuVisible} animationType="none" transparent>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.65)",
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setMeterMenuVisible(false)}
          />
          <Animated.View
            entering={SlideInDown.springify().damping(18).stiffness(140)}
            style={{
              backgroundColor: C.bg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              borderTopWidth: 1,
              borderColor: C.dim,
              maxHeight: "60%",
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: C.dim,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "800", color: C.text }}
              >
                Select Meter
              </Text>
              <Pressable
                onPress={() => setMeterMenuVisible(false)}
                hitSlop={12}
                style={({ pressed }) => ({
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: pressed ? C.surface2 : C.surface,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Ionicons name="close" size={18} color={C.muted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {meters.map((m) => {
                const isSelected = m.id === selectedMeterId;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      setSelectedMeterId(m.id);
                      setMeterMenuVisible(false);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      backgroundColor: isSelected
                        ? `${C.indigo}10`
                        : pressed
                          ? C.surface2
                          : C.surface,
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? C.indigo : C.dim,
                    })}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: isSelected
                          ? `${C.indigo}14`
                          : `${C.blue}14`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="speedometer-outline"
                        size={18}
                        color={isSelected ? C.indigo : C.blue}
                      />
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        color: C.text,
                        fontSize: 15,
                        fontWeight: "600",
                      }}
                    >
                      {m.meterNumber}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={C.indigo}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ── Details Modal ── */}
      <Modal visible={detailsVisible} animationType="none" transparent>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.65)",
            padding: 24,
          }}
        >
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={() => setDetailsVisible(false)}
          />
          <Animated.View
            entering={SlideInDown.springify().damping(16).stiffness(140)}
            style={{
              backgroundColor: C.bg,
              borderRadius: 24,
              padding: 28,
              width: "100%",
              maxWidth: 380,
              borderWidth: 1,
              borderColor: C.dim,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.4,
              shadowRadius: 28,
              elevation: 24,
            }}
          >
            {/* close */}
            <Pressable
              onPress={() => setDetailsVisible(false)}
              hitSlop={12}
              style={({ pressed }) => ({
                position: "absolute",
                top: 14,
                right: 14,
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: pressed ? C.surface2 : C.surface,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              })}
            >
              <Ionicons name="close" size={18} color={C.muted} />
            </Pressable>

            {/* icon */}
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                backgroundColor:
                  selectedNode?.status === "OPERATIONAL"
                    ? `${C.emerald}14`
                    : `${C.rose}14`,
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                marginBottom: 18,
              }}
            >
              <Ionicons
                name={
                  selectedNode?.status === "OPERATIONAL"
                    ? "hardware-chip-outline"
                    : "warning-outline"
                }
                size={28}
                color={
                  selectedNode?.status === "OPERATIONAL" ? C.emerald : C.rose
                }
              />
            </View>

            <Text
              style={{
                color: C.text,
                fontSize: 20,
                fontWeight: "800",
                textAlign: "center",
                marginBottom: 20,
                letterSpacing: -0.3,
              }}
            >
              {selectedNode?.name}
            </Text>

            {/* details rows */}
            {[
              {
                label: "Status",
                value: selectedNode?.status,
                color:
                  selectedNode?.status === "OPERATIONAL" ? C.emerald : C.rose,
                iconName: "pulse-outline" as const,
              },
              {
                label: "Consumption",
                value: `${selectedNode?.energyConsumed?.toFixed(2)} kW`,
                color: C.blue,
                iconName: "flash-outline" as const,
              },
              {
                label: "Meter ID",
                value: selectedNode?.meterId,
                color: C.muted,
                iconName: "link-outline" as const,
                mono: true,
              },
            ].map((row) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: C.surface,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: C.dim,
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
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      backgroundColor: `${row.color}14`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={row.iconName}
                      size={14}
                      color={row.color}
                    />
                  </View>
                  <Text
                    style={{
                      color: C.muted,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {row.label}
                  </Text>
                </View>
                <Text
                  style={{
                    color: row.color,
                    fontSize: row.mono ? 11 : 14,
                    fontWeight: "700",
                    fontFamily: row.mono ? "monospace" : undefined,
                    maxWidth: 140,
                  }}
                  numberOfLines={1}
                >
                  {row.value}
                </Text>
              </View>
            ))}

            {/* close button */}
            <Pressable
              onPress={() => setDetailsVisible(false)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? C.surface2 : C.surface,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                marginTop: 12,
                borderWidth: 1,
                borderColor: C.dim,
              })}
            >
              <Text
                style={{ color: C.text, fontWeight: "700", fontSize: 15 }}
              >
                Close
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}