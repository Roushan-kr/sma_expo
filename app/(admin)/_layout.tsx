import { Drawer } from "expo-router/drawer";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { ActivityIndicator, View, Text, Pressable } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

import { useAuthStore } from "@/stores/useAuthStore";
import { RoleProvider } from "@/context/RoleContext";
import { Permission, hasPermission } from "@/constants/permissions";
import AIChatBot from "@/components/AIChatBot";

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

export default function AdminLayout() {
  const { isSignedIn } = useAuth();
  const { profile, role, loading, error } = useAuthStore();

  const isBootstrapping = isSignedIn && !profile && loading && !error;

  if (isBootstrapping) {
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
              width: 76,
              height: 76,
              borderRadius: 22,
              backgroundColor: "rgba(99,92,241,0.08)",
              borderWidth: 1,
              borderColor: "rgba(99,92,241,0.18)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <ActivityIndicator size="large" color={C.indigo} />
          </View>
        </Animated.View>
        <Animated.Text
          entering={FadeIn.delay(300)}
          style={{ color: C.muted, fontSize: 13 }}
        >
          Loading admin panel…
        </Animated.Text>
      </View>
    );
  }

  const currentRole = role;

  return (
    <RoleProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
          drawerContent={(props) => (
            <CustomDrawerContent role={currentRole} {...props} />
          )}
          screenOptions={{
            headerStyle: { backgroundColor: C.bg, elevation: 0, shadowOpacity: 0 },
            headerTintColor: C.text,
            drawerStyle: { backgroundColor: C.bg, width: 290 },
            drawerActiveTintColor: C.indigo,
            drawerActiveBackgroundColor: "rgba(99,92,241,0.08)",
            drawerInactiveTintColor: C.muted,
            headerTitleStyle: { fontWeight: "700", fontSize: 17 },
            drawerLabelStyle: { fontSize: 14, fontWeight: "600", marginLeft: -8 },
            drawerItemStyle: { borderRadius: 12, paddingVertical: 2, marginHorizontal: 8 },
          }}
        >
          <Drawer.Screen
            name="admin-dashboard"
            options={{
              drawerLabel: "Control Panel",
              title: "Dashboard",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="grid-outline" size={size - 2} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="admin-billing"
            options={{
              drawerLabel: "Billing",
              title: "Billing Reports",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="receipt-outline" size={size - 2} color={color} />
              ),
              drawerItemStyle: !hasPermission(currentRole as any, Permission.BILLING_READ)
                ? { display: "none" }
                : { borderRadius: 12, paddingVertical: 2, marginHorizontal: 8 },
            }}
          />
          <Drawer.Screen
            name="admin-queries"
            options={{
              drawerLabel: "Queries",
              title: "Customer Queries",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="chatbubbles-outline" size={size - 2} color={color} />
              ),
              drawerItemStyle: !hasPermission(currentRole as any, Permission.QUERY_MANAGE)
                ? { display: "none" }
                : { borderRadius: 12, paddingVertical: 2, marginHorizontal: 8 },
            }}
          />
          <Drawer.Screen
            name="admin-consumers"
            options={{
              drawerLabel: "Consumers",
              title: "All Consumers",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="people-outline" size={size - 2} color={color} />
              ),
              drawerItemStyle: !hasPermission(currentRole as any, Permission.CONSUMER_READ)
                ? { display: "none" }
                : { borderRadius: 12, paddingVertical: 2, marginHorizontal: 8 },
            }}
          />
          <Drawer.Screen
            name="admin-meters"
            options={{
              drawerLabel: "Smart Meters",
              title: "Managed Meters",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="speedometer-outline" size={size - 2} color={color} />
              ),
              drawerItemStyle: !hasPermission(currentRole as any, Permission.METER_READ)
                ? { display: "none" }
                : { borderRadius: 12, paddingVertical: 2, marginHorizontal: 8 },
            }}
          />
          <Drawer.Screen
            name="admin-equipment-sld"
            options={{
              drawerLabel: "Equipment SLD",
              title: "Equipment Visualization",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="git-network-outline" size={size - 2} color={color} />
              ),
              drawerItemStyle: !hasPermission(currentRole as any, Permission.METER_READ)
                ? { display: "none" }
                : { borderRadius: 12, paddingVertical: 2, marginHorizontal: 8 },
            }}
          />
          <Drawer.Screen
            name="profile"
            options={{
              drawerLabel: "Settings",
              title: "Admin Profile",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="settings-outline" size={size - 2} color={color} />
              ),
            }}
          />

          {/* Hidden Screens */}
          <Drawer.Screen
            name="admin-query/[id]"
            options={{ drawerItemStyle: { display: "none" }, headerShown: false }}
          />
          <Drawer.Screen
            name="admin-consumer/[id]"
            options={{ drawerItemStyle: { display: "none" }, title: "Consumer Details" }}
          />
          <Drawer.Screen
            name="admin-meter/[id]"
            options={{ drawerItemStyle: { display: "none" }, title: "Meter Details" }}
          />
        </Drawer>
        {profile && <AIChatBot role={currentRole || 'ADMIN'} userId={(profile as any).id} />}
      </GestureHandlerRootView>
    </RoleProvider>
  );
}

function CustomDrawerContent({ role, ...props }: any) {
  const { user } = useUser();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        {/* ── Header ── */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: C.dim,
            marginBottom: 8,
          }}
        >
          <LinearGradient
            colors={[C.indigo, C.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: C.indigo,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Text
              style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}
            >
              {user?.firstName?.[0] ?? "A"}
            </Text>
          </LinearGradient>

          <Text
            style={{
              color: C.text,
              fontSize: 20,
              fontWeight: "800",
              letterSpacing: -0.3,
              marginBottom: 4,
            }}
          >
            SmartMettr
          </Text>
          <Text
            style={{
              color: C.text,
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 2,
            }}
          >
            {user?.firstName} {user?.lastName}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(99,92,241,0.1)",
                borderWidth: 1,
                borderColor: "rgba(99,92,241,0.2)",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  color: C.indigo,
                  fontSize: 10,
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {role?.replace("_", " ") || "UNKNOWN"}
              </Text>
            </View>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: C.emerald,
              }}
            />
            <Text style={{ color: C.emerald, fontSize: 11, fontWeight: "600" }}>
              Online
            </Text>
          </View>
        </View>

        {/* ── nav label ── */}
        <Text
          style={{
            color: C.muted,
            fontSize: 10,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          Navigation
        </Text>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* ── footer ── */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: C.dim,
          padding: 16,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ionicons name="shield-checkmark" size={12} color={C.muted} />
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: "500" }}>
            Secured admin session
          </Text>
        </View>
      </View>
    </View>
  );
}