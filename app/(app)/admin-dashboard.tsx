import { ROLE_TYPE } from '@/types/api.types';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { View, Text } from 'react-native';

export default function AdminDashboardScreen() {
  useRoleGuard([
    ROLE_TYPE.SUPER_ADMIN,
    ROLE_TYPE.STATE_ADMIN,
    ROLE_TYPE.BOARD_ADMIN,
  ]);
  // TODO: Implement admin dashboard with stats, graphs, and management actions
  return (
    <View className="flex-1 items-center justify-center bg-slate-900">
      <Text className="text-2xl font-bold text-slate-50 mb-2">
        Admin Dashboard
      </Text>
      <Text className="text-slate-400">
        Coming soon: stats, graphs, and management actions
      </Text>
    </View>
  );
}
