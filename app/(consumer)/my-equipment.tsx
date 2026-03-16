import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { Text, Card, Chip, ActivityIndicator, Searchbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { apiRequest } from "@/api/common/apiRequest";
import { useStableToken } from "@/hooks/useStableToken";

export default function MyEquipmentScreen() {
  const getToken = useStableToken();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredEquipment = equipment.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <Card className="mb-3 bg-white rounded-xl">
      <Card.Title
        title={item.name}
        subtitle={`Consumption: ${item.energyConsumed.toFixed(2)} kW`}
        left={(props) => (
          <MaterialCommunityIcons {...props} name="robot" size={32} color="#6366f1" />
        )}
        right={(props) => (
          <Chip
            style={{ marginRight: 10 }}
            selectedColor={item.status === "OPERATIONAL" ? "#059669" : "#dc2626"}
          >
            {item.status}
          </Chip>
        )}
      />
    </Card>
  );

  return (
    <View className="flex-1 bg-slate-50 p-4">
      <Searchbar
        placeholder="Search equipment..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        className="mb-4 bg-white"
      />
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center mt-10">
          <ActivityIndicator color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={filteredEquipment}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchEquipment(true)}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="text-slate-500">No equipment found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
