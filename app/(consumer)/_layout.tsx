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

export default function ConsumerLayout() {
  const { isSignedIn } = useAuth();
  const { profile, loading, error } = useAuthStore();

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
          Loading your portal…
        </Animated.Text>
      </View>
    );
  }

  return (
    <RoleProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerStyle: {
              backgroundColor: C.bg,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: C.text,
            drawerStyle: { backgroundColor: C.bg, width: 290 },
            drawerActiveTintColor: C.indigo,
            drawerActiveBackgroundColor: "rgba(99,92,241,0.08)",
            drawerInactiveTintColor: C.muted,
            headerTitleStyle: { fontWeight: "700", fontSize: 17 },
            drawerLabelStyle: {
              fontSize: 14,
              fontWeight: "600",
              marginLeft: -8,
            },
            drawerItemStyle: {
              borderRadius: 12,
              paddingVertical: 2,
              marginHorizontal: 8,
            },
          }}
        >
          <Drawer.Screen
            name="dashboard"
            options={{
              drawerLabel: "Home",
              title: "My Dashboard",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size - 2} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="billing/index"
            options={{
              drawerLabel: "Billing & Payments",
              title: "Billing History",
              drawerIcon: ({ color, size }) => (
                <Ionicons
                  name="receipt-outline"
                  size={size - 2}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="notifications/index"
            options={{
              drawerLabel: "Notifications",
              title: "Notifications",
              drawerIcon: ({ color, size }) => (
                <Ionicons
                  name="notifications-outline"
                  size={size - 2}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="support/index"
            options={{
              drawerLabel: "Support",
              title: "Connect Me",
              drawerIcon: ({ color, size }) => (
                <Ionicons
                  name="chatbubbles-outline"
                  size={size - 2}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="my-equipment"
            options={{
              drawerLabel: "My Equipment",
              title: "Connected Machines",
              drawerIcon: ({ color, size }) => (
                <Ionicons
                  name="hardware-chip-outline"
                  size={size - 2}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="profile"
            options={{
              drawerLabel: "My Account",
              title: "Profile",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size - 2} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="meter/[id]"
            options={{
              drawerItemStyle: { display: "none" },
              title: "Meter Details",
            }}
          />
        </Drawer>
        {profile && <AIChatBot role="CONSUMER" userId={(profile as any).id} />}
      </GestureHandlerRootView>
    </RoleProvider>
  );
}

function CustomDrawerContent(props: any) {
  const { user } = useUser();
  const { profile } = useAuthStore();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        {/* Header */}
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
            colors={[C.blue, C.indigo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: C.blue,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Ionicons name="flash" size={24} color="#fff" />
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
            {(profile as any)?.name ?? user?.firstName ?? "Consumer"}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(56,189,248,0.1)",
                borderWidth: 1,
                borderColor: "rgba(56,189,248,0.2)",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  color: C.blue,
                  fontSize: 10,
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Consumer
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
          Menu
        </Text>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: C.dim,
          padding: 16,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="shield-checkmark" size={12} color={C.muted} />
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: "500" }}>
            Secured session
          </Text>
        </View>
      </View>
    </View>
  );
}
