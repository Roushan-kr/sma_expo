import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function syncUser(clerkToken: string) {
  const response = await api.post(
    '/auth/sync',
    {},
    {
      headers: { Authorization: `Bearer ${clerkToken}` },
    }
  );
  return response.data;
}
