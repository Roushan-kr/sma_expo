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

export default function VerifyScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!isLoaded || !signIn) return;
    if (!code || code.length < 4) {
      setError('Please enter the verification code sent to your email.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code,
      });

      if (result.status === 'complete') {
        // Session is now fully created — activate it
        await setActive({ session: result.createdSessionId });
        router.replace('/(app)/dashboard');
      } else {
        setError('Verification incomplete. Status: ' + result.status);
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        'Invalid code. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !code;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-7 gap-4">
        <Text className="text-4xl font-bold text-slate-50 mb-1">
          Check your email
        </Text>
        <Text className="text-base text-slate-400 mb-2">
          We sent a verification code to your email address. Enter it below to
          complete sign-in.
        </Text>

        <View className="border border-slate-700 rounded-xl bg-slate-800 px-4 py-3">
          <TextInput
            className="text-base text-slate-50 tracking-widest"
            placeholder="Enter code"
            placeholderTextColor="#9ca3af"
            value={code}
            onChangeText={(t) => {
              setError(null);
              setCode(t.trim());
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            returnKeyType="done"
            onSubmitEditing={handleVerify}
            editable={!loading}
            maxLength={8}
          />
        </View>

        {error ? (
          <Text className="text-red-400 text-sm -mt-2">{error}</Text>
        ) : null}

        <Pressable
          className={`rounded-xl py-4 items-center mt-2 ${disabled ? 'bg-indigo-500 opacity-50' : 'bg-indigo-500'}`}
          onPress={handleVerify}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Verify Code"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Verify & Sign In
            </Text>
          )}
        </Pressable>

        <Pressable
          className="items-center mt-2"
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text className="text-slate-400 text-sm">← Back to sign in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
