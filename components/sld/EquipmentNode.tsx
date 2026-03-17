import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, IconButton, useTheme } from "react-native-paper";
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
  const theme = useTheme();
  const isDark = theme.dark;

  return (
    <View 
      style={{ 
        position: "absolute",
        zIndex: 30,
        left: x, 
        top: y, 
        width: 180, 
        height: 48 
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onNodePress(equipment)}
        disabled={isEditMode}
      >
        <Surface 
          elevation={isDark ? 0 : 1}
          style={{
            borderRadius: 12,
            padding: 8,
            backgroundColor: isDark ? "#1e293b" : "white",
            borderWidth: 1.5,
            borderColor: isOnline 
              ? (isDark ? "#10B981" : "#10B981") 
              : (isDark ? "#334155" : "#e2e8f0"),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons
              name="robot"
              size={20}
              color={isOnline ? "#10B981" : (isDark ? "#94a3b8" : "#64748b")}
            />
            <View style={{ flex: 1 }}>
              <Text 
                variant="labelMedium" 
                style={{ 
                  fontWeight: "700", 
                  color: theme.colors.onSurface 
                }} 
                numberOfLines={1}
              >
                {equipment.name}
              </Text>
              <Text 
                variant="labelSmall" 
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {equipment.energyConsumed.toFixed(2)} kW
              </Text>
            </View>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isOnline ? "#10B981" : "#EF4444"
              }}
            />
          </View>
        </Surface>
      </TouchableOpacity>

      {isEditMode && (
        <IconButton
          icon="move-resize"
          size={18}
          mode="contained"
          containerColor={theme.colors.surface}
          iconColor={theme.colors.primary}
          style={{
            position: "absolute",
            top: -12,
            right: -12,
            margin: 0,
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
          }}
          onPress={() => onPositionPress(node)}
        />
      )}
    </View>
  );
}
