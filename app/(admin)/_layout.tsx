import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View, Text } from "react-native";
import React from "react";

import { useAuthStore } from "@/stores/useAuthStore";
import { RoleProvider } from "@/context/RoleContext";
import { Permission, hasPermission } from "@/constants/permissions";

export default function AdminLayout() {
  const { isSignedIn } = useAuth();
  const { profile, role, loading, error } = useAuthStore();

  const isBootstrapping = isSignedIn && !profile && loading && !error;

  if (isBootstrapping) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Use the role from the store directly
  const currentRole = role;

  return (
    <RoleProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
          drawerContent={(props) => (
            <CustomDrawerContent role={currentRole} {...props} />
          )}
          screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#f8fafc",
          drawerStyle: { backgroundColor: "#1e293b", width: 280 },
          drawerActiveTintColor: "#818cf8",
          drawerInactiveTintColor: "#cbd5e1",
          headerTitleStyle: { fontWeight: "800" },
        }}
      >
        <Drawer.Screen
          name="admin-dashboard"
          options={{
            drawerLabel: "Control Panel",
            title: "Admin Dashboard",
          }}
        />
        <Drawer.Screen
          name="admin-billing"
          options={{
            drawerLabel: "Billing Management",
            title: "Billing Reports",
            drawerItemStyle: !hasPermission(
              currentRole as any,
              Permission.BILLING_READ,
            )
              ? { display: "none" }
              : {},
          }}
        />
        <Drawer.Screen
          name="admin-queries"
          options={{
            drawerLabel: "Customer Queries",
            title: "Customer Queries",
            drawerItemStyle: !hasPermission(
              currentRole as any,
              Permission.QUERY_MANAGE,
            )
              ? { display: "none" }
              : {},
          }}
        />
        <Drawer.Screen
          name="admin-consumers"
          options={{
            drawerLabel: "Consumers",
            title: "All Consumers",
            drawerItemStyle: !hasPermission(
              currentRole as any,
              Permission.CONSUMER_READ,
            )
              ? { display: "none" }
              : {},
          }}
        />
        <Drawer.Screen
          name="admin-meters"
          options={{
            drawerLabel: "Smart Meters",
            title: "Managed Meters",
            drawerItemStyle: !hasPermission(
              currentRole as any,
              Permission.METER_READ,
            )
              ? { display: "none" }
              : {},
          }}
        />
        <Drawer.Screen
          name="admin-equipment-sld"
          options={{
            drawerLabel: "Equipment Diagram",
            title: "Equipment Visualization",
            drawerItemStyle: !hasPermission(
              currentRole as any,
              Permission.METER_READ,
            )
              ? { display: "none" }
              : {},
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: "Settings",
            title: "Admin Profile",
          }}
        />

        {/* Hidden Screens */}
        <Drawer.Screen
          name="admin-query/[id]"
          options={{
            drawerItemStyle: { display: "none" },
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="admin-consumer/[id]"
          options={{
            drawerItemStyle: { display: "none" },
            title: "Consumer Details",
          }}
        />
        <Drawer.Screen
          name="admin-meter/[id]"
          options={{
            drawerItemStyle: { display: "none" },
            title: "Meter Details",
          }}
        />
      </Drawer>
      </GestureHandlerRootView>
    </RoleProvider>
  );
}

function CustomDrawerContent({ role, ...props }: any) {
  return (
    <DrawerContentScrollView {...props} className="bg-bg">
      <View className="p-5 border-b border-white/10 mb-2.5">
        <Text className="text-text text-[22px] font-extrabold">
          Admin Portal
        </Text>
        <Text className="text-muted text-xs mt-1 font-semibold uppercase tracking-wider">
          {role?.replace("_", " ") || "UNKNOWN ROLE"}
        </Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}
