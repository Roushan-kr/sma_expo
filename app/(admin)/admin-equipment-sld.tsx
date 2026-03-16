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
import {
  Text,
  IconButton,
  Portal,
  Dialog,
  Button,
  TextInput,
  Menu,
} from "react-native-paper";
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
      const color = node.equipment.status === "OPERATIONAL" ? "#10B981" : "#9CA3AF";
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
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View 
        className="bg-white shadow-sm"
        style={{ paddingTop: insets.top }}
      >
        <View className="h-[60px] flex-row items-center justify-between px-5">
          <Text className="text-xl font-extrabold text-slate-900">System Diagram</Text>
          <IconButton
            icon={isEditMode ? "check" : "pencil-outline"}
            onPress={() => setIsEditMode(!isEditMode)}
          />
        </View>
      </View>

      {/* Meter Selector */}
      <View className="p-4 bg-white border-b border-slate-200">
        <Menu
          visible={meterMenuVisible}
          onDismiss={() => setMeterMenuVisible(false)}
          anchor={
            <TouchableOpacity
              className="flex-row items-center justify-between bg-slate-100 p-3 rounded-xl"
              onPress={() => setMeterMenuVisible(true)}
            >
              <Text className="text-sm font-semibold text-slate-700">
                {meters.find((m) => m.id === selectedMeterId)?.meterNumber || "Select Meter"}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
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
        <View className="flex-row items-center justify-between px-5 bg-blue-50 py-1">
          <Text className="text-slate-700 font-medium">Columns: {numColumns}</Text>
          <View className="flex-row items-center">
            <IconButton icon="minus" onPress={() => setNumColumns(Math.max(1, numColumns - 1))} />
            <IconButton icon="plus" onPress={() => setNumColumns(Math.min(4, numColumns + 1))} />
          </View>
        </View>
      )}

      {/* Canvas */}
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : equipment.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-slate-500">No equipment found for this meter.</Text>
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
                colors={["#1e293b", "#0f172a"]}
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
                }}
              >
                <Text className="text-white font-bold text-sm">
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
          style={{ backgroundColor: "white", borderRadius: 16 }}
        >
          <Dialog.Title className="text-xl font-bold">{selectedNode?.name}</Dialog.Title>
          <Dialog.Content>
            <View className="flex-row justify-between mb-3">
              <Text className="font-bold text-slate-500">Status:</Text>
              <Text 
                className={`font-semibold ${
                  selectedNode?.status === "OPERATIONAL" ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {selectedNode?.status}
              </Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="font-bold text-slate-500">Consumption:</Text>
              <Text className="text-slate-900 font-medium">
                {selectedNode?.energyConsumed.toFixed(2)} kW
              </Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="font-bold text-slate-500">Meter ID:</Text>
              <Text className="text-slate-400 text-xs">
                {selectedNode?.meterId}
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setDetailsVisible(false)}
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
