import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInDown,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";

const BACKEND_URL =
  Platform.OS === "android"
    ? "http://10.13.73.198:3000"
    : "http://localhost:3000";

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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
}

interface AIChatBotProps {
  role: string;
  userId: string;
}

// ─── Quick Suggestions ────────────────────────────────────────────────────────

const CONSUMER_SUGGESTIONS = [
  { icon: "flash-outline" as const, text: "Check my consumption" },
  { icon: "receipt-outline" as const, text: "View latest bill" },
  { icon: "alert-circle-outline" as const, text: "Report an issue" },
  { icon: "help-circle-outline" as const, text: "How to save energy?" },
];

const ADMIN_SUGGESTIONS = [
  { icon: "stats-chart-outline" as const, text: "System overview" },
  { icon: "people-outline" as const, text: "Consumer statistics" },
  { icon: "speedometer-outline" as const, text: "Meter health check" },
  { icon: "trending-up-outline" as const, text: "Revenue summary" },
];

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const bounce = (delay: number) =>
      withRepeat(
        withSequence(
          withTiming(0, { duration: delay, easing: Easing.linear }),
          withTiming(-6, { duration: 250, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      );

    dot1.value = bounce(0);
    dot2.value = bounce(150);
    dot3.value = bounce(300);
  }, []);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));
  const style2 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));
  const style3 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        maxWidth: "75%",
        marginBottom: 16,
      }}
    >
      {/* AI Avatar */}
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          backgroundColor: `${C.blue}14`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="sparkles" size={14} color={C.blue} />
      </View>

      <View
        style={{
          backgroundColor: C.surface2,
          borderRadius: 18,
          borderTopLeftRadius: 4,
          paddingHorizontal: 18,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          borderWidth: 1,
          borderColor: C.dim,
        }}
      >
        {[style1, style2, style3].map((style, i) => (
          <Animated.View
            key={i}
            style={[
              style,
              {
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: C.blue,
                opacity: 0.7,
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  index,
}: {
  message: Message;
  index: number;
}) {
  const isUser = message.sender === "user";
  const time = new Date(message.timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Animated.View
      entering={
        isUser
          ? SlideInRight.duration(350).delay(50)
          : SlideInLeft.duration(350).delay(50)
      }
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 8,
        maxWidth: "82%",
        marginBottom: 14,
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            backgroundColor: `${C.blue}14`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 2,
          }}
        >
          <Ionicons name="sparkles" size={14} color={C.blue} />
        </View>
      )}

      {/* Bubble */}
      <View
        style={{
          flex: 1,
        }}
      >
        {isUser ? (
          <LinearGradient
            colors={[C.indigo, C.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 18,
              borderBottomRightRadius: 4,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              {message.text}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 10,
                marginTop: 6,
                alignSelf: "flex-end",
              }}
            >
              {time}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={{
              backgroundColor: C.surface2,
              borderRadius: 18,
              borderTopLeftRadius: 4,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: C.dim,
            }}
          >
            <Text
              style={{
                color: C.text,
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              {message.text}
            </Text>
            <Text
              style={{
                color: C.dim,
                fontSize: 10,
                marginTop: 6,
                alignSelf: "flex-start",
              }}
            >
              {time}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  role,
  onSuggestionPress,
}: {
  role: string;
  onSuggestionPress: (text: string) => void;
}) {
  const suggestions =
    role === "CONSUMER" ? CONSUMER_SUGGESTIONS : ADMIN_SUGGESTIONS;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingBottom: 40,
      }}
    >
      {/* Icon */}
      <Animated.View
        entering={ZoomIn.springify().delay(200)}
        style={{ marginBottom: 20 }}
      >
        <LinearGradient
          colors={[C.blue, C.indigo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: C.blue,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 14,
            elevation: 8,
          }}
        >
          <Ionicons name="sparkles" size={32} color="#fff" />
        </LinearGradient>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(300).duration(400)}
        style={{
          color: C.text,
          fontSize: 20,
          fontWeight: "800",
          marginBottom: 8,
          letterSpacing: -0.3,
        }}
      >
        Hi there! 👋
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(400).duration(400)}
        style={{
          color: C.muted,
          fontSize: 14,
          textAlign: "center",
          lineHeight: 21,
          marginBottom: 28,
          paddingHorizontal: 12,
        }}
      >
        I'm your SmartMettr AI assistant. Ask me anything about{" "}
        {role === "CONSUMER"
          ? "your account, consumption, or billing"
          : "the system, consumers, or operations"}
        .
      </Animated.Text>

      {/* Suggestion chips */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(400)}
        style={{
          width: "100%",
          gap: 8,
        }}
      >
        <Text
          style={{
            color: C.dim,
            fontSize: 10,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 4,
            textAlign: "center",
          }}
        >
          Try asking
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {suggestions.map((s, i) => (
            <Animated.View
              key={s.text}
              entering={FadeInDown.delay(550 + i * 60).duration(300)}
            >
              <Pressable
                onPress={() => onSuggestionPress(s.text)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: pressed ? C.surface2 : C.surface,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: C.dim,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <Ionicons name={s.icon} size={14} color={C.blue} />
                <Text
                  style={{
                    color: C.text,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {s.text}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Connection Status ────────────────────────────────────────────────────────

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: connected
          ? "rgba(34,197,94,0.08)"
          : "rgba(244,63,94,0.08)",
        borderWidth: 1,
        borderColor: connected
          ? "rgba(34,197,94,0.15)"
          : "rgba(244,63,94,0.15)",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: connected ? C.emerald : C.rose,
        }}
      />
      <Text
        style={{
          color: connected ? C.emerald : C.rose,
          fontSize: 10,
          fontWeight: "700",
        }}
      >
        {connected ? "Live" : "Offline"}
      </Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIChatBot({ role, userId }: AIChatBotProps) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Unread badge
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    // Reset unread when opened
    setUnreadCount(0);

    socketRef.current = io(BACKEND_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      setConnected(true);
      console.log("Connected to AI Chat Backend");
    });

    socketRef.current.on("disconnect", () => {
      setConnected(false);
    });

    socketRef.current.on("chat:typing", () => {
      setIsTyping(true);
    });

    socketRef.current.on(
      "chat:reply",
      (data: { message: string; timestamp: string }) => {
        setIsTyping(false);
        const newMsg: Message = {
          id: `ai_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          text: data.message,
          sender: "ai",
          timestamp: data.timestamp,
        };
        setMessages((prev) => [...prev, newMsg]);
      },
    );

    socketRef.current.on("chat:error", (error: any) => {
      setIsTyping(false);
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        text: "Sorry, something went wrong. Please try again.",
        sender: "ai",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      console.error("Chat error:", error);
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isOpen]);

  // Auto-scroll on new messages
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    (text?: string) => {
      const msgText = (text || input).trim();
      if (!msgText || !socketRef.current?.connected) return;

      const newMessage: Message = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        text: msgText,
        sender: "user",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessage]);
      setInput("");

      socketRef.current.emit("chat:message", {
        message: msgText,
        role,
        userId,
      });
    },
    [input, role, userId],
  );

  const handleSuggestionPress = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  // Web keyboard shortcuts
  useEffect(() => {
    if (Platform.OS === "web" && isOpen) {
      const handleKeyDown = (e: any) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          sendMessage();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, sendMessage]);

  // ── FAB (Floating Action Button) ──
  if (!isOpen) {
    return (
      <Animated.View
        entering={ZoomIn.springify().delay(500)}
        style={{
          position: "absolute",
          bottom: 28 + insets.bottom,
          right: 20,
          zIndex: 9999,
        }}
      >
        <Pressable
          onPress={() => setIsOpen(true)}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.9 : 1 }],
            shadowColor: C.indigo,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 18,
            elevation: 14,
          })}
        >
          <LinearGradient
            colors={[C.blue, C.indigo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 62,
              height: 62,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chatbubbles" size={26} color="#fff" />
          </LinearGradient>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <Animated.View
              entering={ZoomIn.springify()}
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: C.rose,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 5,
                borderWidth: 2,
                borderColor: C.bg,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "800",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
    );
  }

  // ── Chat Modal ──
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={() => setIsOpen(false)}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        style={{
          flex: 1,
          backgroundColor: "rgba(4,10,26,0.85)",
          justifyContent: "flex-end",
        }}
      >
        {/* Backdrop dismiss */}
        <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(18).stiffness(130)}
            style={{
              backgroundColor: C.bg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              height: Dimensions.get("window").height * 0.82,
              borderTopWidth: 1,
              borderColor: C.dim,
              overflow: "hidden",
            }}
          >
            {/* ── Handle bar ── */}
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: C.dim,
                alignSelf: "center",
                marginTop: 10,
                marginBottom: 6,
              }}
            />

            {/* ── Header ── */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: C.dim,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <LinearGradient
                  colors={[C.blue, C.indigo]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="sparkles" size={20} color="#fff" />
                </LinearGradient>
                <View>
                  <Text
                    style={{
                      color: C.text,
                      fontSize: 17,
                      fontWeight: "800",
                      letterSpacing: -0.3,
                    }}
                  >
                    AI Assistant
                  </Text>
                  <ConnectionBadge connected={connected} />
                </View>
              </View>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                {/* Clear chat */}
                {messages.length > 0 && (
                  <Pressable
                    onPress={clearChat}
                    hitSlop={8}
                    style={({ pressed }) => ({
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: pressed ? C.surface2 : C.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: C.dim,
                    })}
                  >
                    <Ionicons name="trash-outline" size={16} color={C.muted} />
                  </Pressable>
                )}

                {/* Close */}
                <Pressable
                  onPress={() => setIsOpen(false)}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: pressed ? C.surface2 : C.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: C.dim,
                  })}
                >
                  <Ionicons name="close" size={18} color={C.muted} />
                </Pressable>
              </View>
            </View>

            {/* ── Messages ── */}
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
                flexGrow: messages.length === 0 ? 1 : undefined,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 ? (
                <EmptyState
                  role={role}
                  onSuggestionPress={handleSuggestionPress}
                />
              ) : (
                <>
                  {/* Date separator for first message */}
                  <View
                    style={{
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: C.surface,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: C.dim,
                      }}
                    >
                      <Text
                        style={{
                          color: C.dim,
                          fontSize: 10,
                          fontWeight: "600",
                        }}
                      >
                        {new Date(messages[0].timestamp).toLocaleDateString(
                          "en-IN",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </Text>
                    </View>
                  </View>

                  {messages.map((msg, index) => (
                    <MessageBubble key={msg.id} message={msg} index={index} />
                  ))}
                </>
              )}

              {isTyping && <TypingIndicator />}
            </ScrollView>

            {/* ── Input Area ── */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: Platform.OS === "ios" ? insets.bottom + 8 : 16,
                borderTopWidth: 1,
                borderTopColor: C.dim,
                backgroundColor: C.bg,
              }}
            >
              {/* Connection warning */}
              {!connected && messages.length > 0 && (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: "rgba(244,63,94,0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(244,63,94,0.12)",
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 10,
                  }}
                >
                  <Ionicons
                    name="cloud-offline-outline"
                    size={14}
                    color={C.rose}
                  />
                  <Text
                    style={{
                      color: C.rose,
                      fontSize: 11,
                      flex: 1,
                    }}
                  >
                    Connection lost. Reconnecting…
                  </Text>
                </Animated.View>
              )}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  gap: 10,
                }}
              >
                {/* Text Input */}
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "flex-end",
                    backgroundColor: C.surface,
                    borderRadius: 22,
                    borderWidth: 1.5,
                    borderColor: inputFocused ? C.indigo : C.dim,
                    paddingHorizontal: 16,
                    paddingVertical: Platform.OS === "ios" ? 12 : 8,
                    minHeight: 48,
                    maxHeight: 120,
                  }}
                >
                  <TextInput
                    ref={inputRef}
                    value={input}
                    onChangeText={setInput}
                    placeholder={
                      connected
                        ? "Type your message..."
                        : "Waiting for connection..."
                    }
                    placeholderTextColor={C.muted}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    onSubmitEditing={() => sendMessage()}
                    editable={connected}
                    multiline
                    style={{
                      flex: 1,
                      color: C.text,
                      fontSize: 15,
                      lineHeight: 21,
                      maxHeight: 80,
                    }}
                  />
                </View>

                {/* Send Button */}
                <Pressable
                  onPress={() => sendMessage()}
                  disabled={!input.trim() || !connected}
                  style={({ pressed }) => ({
                    borderRadius: 16,
                    overflow: "hidden",
                    opacity: !input.trim() || !connected ? 0.4 : 1,
                    transform: [
                      {
                        scale: pressed && input.trim() && connected ? 0.9 : 1,
                      },
                    ],
                  })}
                >
                  <LinearGradient
                    colors={
                      input.trim() && connected
                        ? [C.indigo, C.violet]
                        : [C.surface, C.surface]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: input.trim() && connected ? 0 : 1,
                      borderColor: C.dim,
                    }}
                  >
                    <Ionicons
                      name="send"
                      size={20}
                      color={input.trim() && connected ? "#fff" : C.muted}
                      style={{ marginLeft: 2 }}
                    />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
