import { useEffect } from "react";
import { useCurrentRole } from "@/hooks/useRoleBasedView";
import { useRouter } from "expo-router";
import { ROLE_TYPE } from "@/types/api.types";

export default function AppEntryRedirect() {
  const role = useCurrentRole();
  const router = useRouter();

  useEffect(() => {
    if (!role) return;

    // Redirect cleanly based on role
    if (role === "CONSUMER") {
      router.replace("/(consumer)/dashboard");
    } else {
      router.replace("/(admin)/admin-dashboard");
    }
  }, [role, router]);

  return null;
}
