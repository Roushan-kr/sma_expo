import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface AdminListLayoutProps<T> {
  title: string;
  data: T[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  renderItem: ({ item }: { item: T }) => React.ReactElement;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  error: string | null;
  onRetry: () => void;
  emptyIcon?: string;
  emptyText?: string;
  headerRight?: () => React.ReactNode;
}

export function AdminListLayout<T extends { id: string }>({
  title,
  data,
  loading,
  refreshing,
  onRefresh,
  renderItem,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  error,
  onRetry,
  emptyIcon = "search-outline",
  emptyText = "No results found",
  headerRight,
}: AdminListLayoutProps<T>) {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Text className="text-[22px] font-extrabold text-text">{title}</Text>
        {headerRight?.()}
      </View>

      {/* Search Bar */}
      <View className="px-5 mb-3">
        <View className="flex-row items-center bg-surface rounded-xl px-3 py-2.5 space-x-2">
          <Ionicons name="search" size={18} color="#475569" />
          <TextInput
            className="flex-1 text-sm text-text h-10"
            placeholder={searchPlaceholder}
            placeholderTextColor="#475569"
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange("")}>
              <Ionicons name="close-circle" size={18} color="#475569" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Error State */}
      {error ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-rose text-center mb-4">{error}</Text>
          <Pressable
            onPress={onRetry}
            className="bg-indigo px-6 py-2.5 rounded-xl"
          >
            <Text className="text-white font-bold">Retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-muted mt-3">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center pt-20 space-y-3">
              <Ionicons name={emptyIcon as any} size={48} color="#475569" />
              <Text className="text-muted text-base">{emptyText}</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
