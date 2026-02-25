import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function SignInScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhone = (raw: string) => {
    const stripped = raw.replace(/[^\d+]/g, '');
    return stripped.startsWith('+') ? stripped : `+${stripped}`;
  };

  const handleSendOTP = async () => {
    if (!isLoaded) return;

    const formatted = formatPhone(phoneNumber);
    if (formatted.length < 8) {
      setError('Please enter a valid phone number with country code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signIn.create({
        strategy: 'phone_code',
        identifier: formatted,
      });

      router.push({
        pathname: '/(auth)/verify',
        params: { phone: formatted },
      });
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        'Failed to send OTP. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !phoneNumber;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-7 gap-4">
        <Text className="text-4xl font-bold text-slate-50 mb-1">Welcome</Text>
        <Text className="text-base text-slate-400 mb-2">
          Enter your phone number to continue
        </Text>

        <View className="border border-slate-700 rounded-xl bg-slate-800 px-4 py-3">
          <TextInput
            className="text-base text-slate-50"
            placeholder="+91 98765 43210"
            placeholderTextColor="#9ca3af"
            value={phoneNumber}
            onChangeText={(t) => {
              setError(null);
              setPhoneNumber(t);
            }}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="done"
            onSubmitEditing={handleSendOTP}
            editable={!loading}
          />
        </View>

        {error ? (
          <Text className="text-red-400 text-sm -mt-2">{error}</Text>
        ) : null}

        <Pressable
          className={`rounded-xl py-4 items-center mt-2 ${disabled ? 'bg-indigo-500 opacity-50' : 'bg-indigo-500'}`}
          onPress={handleSendOTP}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Send OTP"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Send OTP</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
