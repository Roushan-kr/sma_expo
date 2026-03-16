import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface EquipmentNodeProps {
  node: {
    equipment: {
      id: string;
      name: string;
      status: string;
      energyConsumed: number;
      isAlive?: boolean;
    };
    x: number;
    y: number;
  };
  isEditMode: boolean;
  onPositionPress: (node: any) => void;
  onNodePress: (equipment: any) => void;
}

export default function EquipmentNode({
  node,
  isEditMode,
  onPositionPress,
  onNodePress,
}: EquipmentNodeProps) {
  const { equipment, x, y } = node;
  const isOnline = equipment.status === "OPERATIONAL";

  return (
    <View 
      className="absolute z-30"
      style={{ left: x, top: y, width: 180, height: 48 }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onNodePress(equipment)}
        disabled={isEditMode}
      >
        <Surface 
          elevation={2}
          className={`rounded-lg p-2 bg-white border-[1.5px] ${
            isOnline ? "border-emerald-500" : "border-gray-300"
          }`}
        >
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons
              name="robot"
              size={20}
              color={isOnline ? "#059669" : "#6B7280"}
            />
            <View className="flex-1">
              <Text className="text-[12px] font-bold text-gray-900" numberOfLines={1}>
                {equipment.name}
              </Text>
              <Text className="text-[10px] text-gray-500">
                {equipment.energyConsumed.toFixed(2)} kW
              </Text>
            </View>
            <View
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
          </View>
        </Surface>
      </TouchableOpacity>

      {isEditMode && (
        <IconButton
          icon="move-resize"
          size={20}
          containerColor="white"
          className="absolute -top-[15px] -right-[15px] border border-gray-200"
          onPress={() => onPositionPress(node)}
        />
      )}
    </View>
  );
}
