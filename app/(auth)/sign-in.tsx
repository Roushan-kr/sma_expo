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
import { syncUser } from '@/lib/api';
import { SIGNIN_METHOD } from '@/lib/env';

export default function SignInScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  // Shared state
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone/email logic
  const isEmail = SIGNIN_METHOD;

  const handleSend = async () => {
    if (!isLoaded) return;
    if (isEmail) {
      if (!input.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
    } else {
      const stripped = input.replace(/[^\d+]/g, '');
      if (stripped.length < 8) {
        setError('Please enter a valid phone number with country code.');
        return;
      }
    }
    setError(null);
    setLoading(true);
    try {
      await signIn.create({
        strategy: isEmail ? 'email_code' : 'phone_code',
        identifier: input,
      });
      router.push({
        pathname: '/(auth)/verify',
        params: isEmail ? { email: input } : { phone: input },
      });
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        `Failed to send ${isEmail ? 'code' : 'OTP'}. Please try again.`;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !input;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-7 gap-4">
        <Text className="text-4xl font-bold text-slate-50 mb-1">Welcome</Text>
        <Text className="text-base text-slate-400 mb-2">
          {isEmail
            ? 'Enter your email to continue'
            : 'Enter your phone number to continue'}
        </Text>

        <View className="border border-slate-700 rounded-xl bg-slate-800 px-4 py-3">
          <TextInput
            className="text-base text-slate-50"
            placeholder={isEmail ? 'you@email.com' : '+91 98765 43210'}
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={(t) => {
              setError(null);
              setInput(t);
            }}
            keyboardType={isEmail ? 'email-address' : 'phone-pad'}
            autoComplete={isEmail ? 'email' : 'tel'}
            textContentType={isEmail ? 'emailAddress' : 'telephoneNumber'}
            returnKeyType="done"
            onSubmitEditing={handleSend}
            editable={!loading}
          />
        </View>

        {error ? (
          <Text className="text-red-400 text-sm -mt-2">{error}</Text>
        ) : null}

        <Pressable
          className={`rounded-xl py-4 items-center mt-2 ${disabled ? 'bg-indigo-500 opacity-50' : 'bg-indigo-500'}`}
          onPress={handleSend}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={isEmail ? 'Send Code' : 'Send OTP'}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              {isEmail ? 'Send Code' : 'Send OTP'}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
