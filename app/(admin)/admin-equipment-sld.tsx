import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text, IconButton, Portal, Dialog, Button, TextInput, Menu, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path, Circle, Defs, Marker } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/api/common/apiRequest";
import { useStableToken } from "@/hooks/useStableToken";
import EquipmentNode from "@/components/sld/EquipmentNode";

const NODE_WIDTH = 180;
const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 100;
const ROOT_WIDTH = 250;
const ROOT_HEIGHT = 60;
const CANVAS_PADDING = 40;
const BUS_OFFSET = 40;

export default function AdminEquipmentSLDScreen() {
  const insets = useSafeAreaInsets();
  const getToken = useStableToken();
  const theme = useTheme();
  const isDark = theme.dark;

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
    if (selectedMeterId) {
      fetchEquipment(selectedMeterId);
    }
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
      return { nodes: [], connections: [], totalWidth: Dimensions.get("window").width, totalHeight: 400 };

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
      const color = node.equipment.status === "OPERATIONAL" 
        ? (isDark ? "#10B981" : "#059669") 
        : (isDark ? "#4B5563" : "#9CA3AF");
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

  const getSmoothPath = (x1: number, y1: number, busY: number, x2: number, y2: number) => {
    const r = 10;
    const xDir = x2 > x1 ? 1 : -1;
    if (Math.abs(x1 - x2) < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;
    return `
      M ${x1} ${y1}
      L ${x1} ${busY - r}
      Q ${x1} ${busY} ${x1 + r * xDir} ${busY}
      L ${x2 - r * xDir} ${busY}
      Q ${x2} ${busY} ${x2} ${busY + r}
      L ${x2} ${y2}
    `;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View 
        style={{ 
          paddingTop: insets.top,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1e293b" : "#f1f5f9",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <View className="h-[60px] flex-row items-center justify-between px-5">
          <Text variant="titleLarge" style={{ fontWeight: "800", color: theme.colors.onSurface }}>System Diagram</Text>
          <IconButton
            icon={isEditMode ? "check" : "pencil-outline"}
            mode="contained-tonal"
            onPress={() => setIsEditMode(!isEditMode)}
          />
        </View>
      </View>

      {/* Meter Selector */}
      <View 
        style={{ 
          padding: 16, 
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1e293b" : "#f1f5f9",
        }}
      >
        <Menu
          visible={meterMenuVisible}
          onDismiss={() => setMeterMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                justifyContent: "space-between", 
                backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                padding: 12,
                borderRadius: 12,
              }}
              onPress={() => setMeterMenuVisible(true)}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.onSurfaceVariant }}>
                {meters.find((m) => m.id === selectedMeterId)?.meterNumber || "Select Meter"}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          }
        >
          {meters.map((m) => (
            <Menu.Item
              key={m.id}
              onPress={() => {
                setSelectedMeterId(m.id);
                setMeterMenuVisible(false);
              }}
              title={m.meterNumber}
            />
          ))}
        </Menu>
      </View>

      {/* Edit Controls */}
      {isEditMode && (
        <View 
          style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            justifyContent: "space-between", 
            paddingHorizontal: 20, 
            backgroundColor: isDark ? "#1e3a8a" : "#eff6ff",
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: isDark ? "#bfdbfe" : "#1e40af", fontWeight: "500" }}>Columns: {numColumns}</Text>
          <View className="flex-row items-center">
            <IconButton icon="minus" size={20} onPress={() => setNumColumns(Math.max(1, numColumns - 1))} />
            <IconButton icon="plus" size={20} onPress={() => setNumColumns(Math.min(4, numColumns + 1))} />
          </View>
        </View>
      )}

      {/* Canvas */}
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : equipment.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No equipment found for this meter.</Text>
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
              <Svg height={layout.totalHeight} width={layout.totalWidth}>
                {layout.connections.map((conn, i) => (
                  <React.Fragment key={i}>
                    <Path
                      d={getSmoothPath(conn.startX, conn.startY, conn.busY, conn.endX, conn.endY)}
                      stroke={conn.color}
                      strokeWidth="2"
                      fill="none"
                    />
                    <Circle cx={conn.startX} cy={conn.startY} r="4" fill={conn.color} />
                  </React.Fragment>
                ))}
              </Svg>

               {/* Root Node (Meter) */}
              <LinearGradient
                colors={isDark ? ["#334155", "#1e293b"] : ["#1e293b", "#0f172a"]}
                style={{ 
                  left: layout.rootX, 
                  top: layout.rootY, 
                  width: ROOT_WIDTH, 
                  height: ROOT_HEIGHT,
                  position: "absolute",
                  borderRadius: 30,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 40,
                  borderWidth: isDark ? 1 : 0,
                  borderColor: "#475569",
                }}
              >
                <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
                  Meter: {meters.find((m) => m.id === selectedMeterId)?.meterNumber}
                </Text>
              </LinearGradient>

              {layout.nodes.map((node) => (
                <EquipmentNode
                  key={node.equipment.id}
                  node={node}
                  isEditMode={isEditMode}
                  onNodePress={(eq) => {
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

      {/* Details Dialog */}
      <Portal>
        <Dialog 
          visible={detailsVisible} 
          onDismiss={() => setDetailsVisible(false)}
          style={{ backgroundColor: theme.colors.surface, borderRadius: 24 }}
        >
          <Dialog.Title style={{ fontWeight: "700" }}>{selectedNode?.name}</Dialog.Title>
          <Dialog.Content>
            <View className="flex-row justify-between mb-3">
              <Text style={{ fontWeight: "700", color: theme.colors.onSurfaceVariant }}>Status:</Text>
              <Text 
                style={{ 
                  fontWeight: "600",
                  color: selectedNode?.status === "OPERATIONAL" ? "#10B981" : "#EF4444"
                }}
              >
                {selectedNode?.status}
              </Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text style={{ fontWeight: "700", color: theme.colors.onSurfaceVariant }}>Consumption:</Text>
              <Text style={{ color: theme.colors.onSurface, fontWeight: "500" }}>
                {selectedNode?.energyConsumed.toFixed(2)} kW
              </Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text style={{ fontWeight: "700", color: theme.colors.onSurfaceVariant }}>Meter ID:</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}>
                {selectedNode?.meterId}
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setDetailsVisible(false)}
              mode="text"
              labelStyle={{ fontWeight: "700" }}
            >
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
