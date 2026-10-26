/**
 * AI Support Component
 * Modern iOS-styled floating icon trigger and minimizable chat interface modal
 * with real-time Supabase support ticket synchronization, real-time admin replies,
 * fresh session start, initial greeting, quick action suggestions, and optimized list rendering.
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../../services/supabase';
import { SupportService, type SupportTicketMessage } from '../../services/support.service';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'admin';
  text: string;
  timestamp: number;
}

const STORAGE_KEY = '@nomadiqe/ai_chat_history';

// ----------------------------------------------------------------------
// Memoized Message Bubble Item for Peak VirtualizedList Performance
// ----------------------------------------------------------------------
interface MessageBubbleProps {
  item: ChatMessage;
  isDark: boolean;
  textColor: string;
  secondaryColor: string;
  bubbleAiBg: string;
  bubbleAiBorder: string;
  adminBadgeText: string;
}

const MessageBubbleItem = memo(function MessageBubbleItem({
  item,
  isDark,
  textColor,
  secondaryColor,
  bubbleAiBg,
  bubbleAiBorder,
  adminBadgeText,
}: MessageBubbleProps) {
  const timeString = new Date(item.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (item.sender === 'user') {
    return (
      <View style={styles.userMessageRow}>
        <View style={[styles.userBubble, { backgroundColor: theme.colors.primary.blue }]}>
          <Text style={styles.userMessageText}>{item.text}</Text>
          <Text style={styles.userTimeText}>{timeString}</Text>
        </View>
      </View>
    );
  }

  if (item.sender === 'admin') {
    return (
      <View style={styles.adminMessageRow}>
        <View style={[styles.adminAvatar, { backgroundColor: theme.colors.system.green }]}>
          <Ionicons name="person" size={13} color="#FFFFFF" />
        </View>
        <View
          style={[
            styles.adminBubble,
            {
              backgroundColor: isDark ? '#1C2E24' : '#E8F5E9',
              borderColor: isDark ? 'rgba(52, 199, 89, 0.3)' : 'rgba(52, 199, 89, 0.4)',
            },
          ]}
        >
          <View style={styles.adminBadgeRow}>
            <Ionicons name="shield-checkmark" size={12} color={theme.colors.system.green} />
            <Text style={[styles.adminBadgeText, { color: theme.colors.system.green }]}>
              {adminBadgeText}
            </Text>
          </View>
          <Text style={[styles.adminMessageText, { color: textColor }]}>{item.text}</Text>
          <Text style={[styles.aiTimeText, { color: secondaryColor }]}>{timeString}</Text>
        </View>
      </View>
    );
  }

  // AI response bubble
  return (
    <View style={styles.aiMessageRow}>
      <LinearGradient
        colors={[theme.colors.primary.blue, theme.colors.primary.purple]}
        style={styles.aiAvatar}
      >
        <Ionicons name="sparkles" size={12} color="#FFFFFF" />
      </LinearGradient>
      <View style={[styles.aiBubble, { backgroundColor: bubbleAiBg, borderColor: bubbleAiBorder }]}>
        <Text style={[styles.aiMessageText, { color: textColor }]}>{item.text}</Text>
        <Text style={[styles.aiTimeText, { color: secondaryColor }]}>{timeString}</Text>
      </View>
    </View>
  );
});

// ----------------------------------------------------------------------
// Isolated Input Bar Component to prevent parent & list re-renders on keystroke
// ----------------------------------------------------------------------
interface ChatInputBarProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  isDark: boolean;
  placeholder: string;
  secondaryColor: string;
  textColor: string;
  inputBg: string;
  headerBorder: string;
  insetsBottom: number;
}

const ChatInputBar = memo(function ChatInputBar({
  onSend,
  isLoading,
  isDark,
  placeholder,
  secondaryColor,
  textColor,
  inputBg,
  headerBorder,
  insetsBottom,
}: ChatInputBarProps) {
  const [inputText, setInputText] = useState('');

  const handleSendPress = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInputText('');
  };

  const hasText = inputText.trim().length > 0;

  return (
    <View
      style={[
        styles.inputBar,
        {
          backgroundColor: isDark ? theme.colors.dark.secondaryBackground : '#FFFFFF',
          borderTopColor: headerBorder,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insetsBottom, 12) : 12,
        },
      ]}
    >
      <View style={[styles.inputFieldWrap, { backgroundColor: inputBg }]}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder={placeholder}
          placeholderTextColor={secondaryColor}
          style={[styles.textInput, { color: textColor }]}
          multiline
          maxLength={1000}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            {
              backgroundColor:
                hasText && !isLoading
                  ? theme.colors.primary.blue
                  : isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.06)',
            },
          ]}
          onPress={handleSendPress}
          disabled={!hasText || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="arrow-up"
              size={18}
              color={hasText ? '#FFFFFF' : secondaryColor}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ----------------------------------------------------------------------
// Main AI Support Widget Component
// ----------------------------------------------------------------------
interface AiSupportWidgetProps {
  /** Optional custom position style for the floating button */
  fabStyle?: object;
  /** Whether to show the floating action button (default: true) */
  showFab?: boolean;
  /** Controlled open state */
  isOpen?: boolean;
  /** Controlled open state setter */
  onOpenChange?: (open: boolean) => void;
  /**
   * Guest reply preview: Madi answers from this property's guide instead of the
   * generic Nomadiqe knowledge base. The conversation is not logged as a support
   * ticket, so previewing never reaches the admin queue.
   */
  propertyId?: string;
}

export function AiSupportWidget({
  fabStyle,
  showFab = true,
  isOpen: controlledIsOpen,
  onOpenChange,
  propertyId,
}: AiSupportWidgetProps): React.JSX.Element {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const isGuidePreview = Boolean(propertyId);

  const setIsModalOpen = useCallback(
    (open: boolean) => {
      if (onOpenChange) {
        onOpenChange(open);
      } else {
        setInternalIsOpen(open);
      }
    },
    [onOpenChange]
  );

  // Helper to create the initial localized greeting message
  const createInitialGreeting = useCallback((): ChatMessage => {
    return {
      id: 'greeting-initial',
      sender: 'ai',
      text: isGuidePreview
        ? t('aiSupport.guidePreviewGreeting')
        : t('aiSupport.initialGreeting') ||
          "Hello! I'm Madi, Nomadiqe's official AI assistant. How may I help you today? Feel free to ask anything about Nomadiqe, hosting, or collaborations.",
      timestamp: Date.now(),
    };
  }, [t, isGuidePreview]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'greeting-initial',
      sender: 'ai',
      text:
        "Hello! I'm Madi, Nomadiqe's official AI assistant. How may I help you today? Feel free to ask anything about Nomadiqe, hosting, or collaborations.",
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const ticketIdRef = useRef<string | null>(null);
  ticketIdRef.current = ticketId;

  // Initialize fresh session chat and support ticket
  useEffect(() => {
    // Clear any previous persistent storage so chat starts fresh each app launch
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});

    // Set fresh initial greeting
    setMessages([createInitialGreeting()]);

    // If user is authenticated, initialize/get support ticket for real-time sync & admin replies
    if (user?.id && !isGuidePreview) {
      SupportService.getOrCreateAiSupportTicket(
        user.id,
        Platform.OS === 'ios' ? 'iOS' : 'Android'
      )
        .then((ticket) => {
          if (ticket?.id) {
            setTicketId(ticket.id);
          }
        })
        .catch((err) => {
          console.warn('Could not initialize support ticket with Supabase:', err);
        });
    }
  }, [user?.id, createInitialGreeting, isGuidePreview]);

  // Real-time Supabase listener for admin replies during the current session
  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`ai-support-ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `support_ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportTicketMessage;
          if (newMsg && newMsg.sender_type === 'admin') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) {
                return prev;
              }
              const adminMessage: ChatMessage = {
                id: newMsg.id || `admin-${Date.now()}`,
                sender: 'admin',
                text: newMsg.body,
                timestamp: new Date(newMsg.created_at).getTime(),
              };
              return [...prev, adminMessage];
            });
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsModalOpen(true);
  };

  const handleMinimize = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsModalOpen(false);
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Persist real-time to Supabase ticket so admin can view
    const currentTid = ticketIdRef.current;
    if (user?.id && currentTid) {
      SupportService.addUserMessage(currentTid, user.id, trimmed).catch((err) => {
        console.warn('Failed to post user message to Supabase support ticket:', err);
      });
    }

    try {
      const history = messages
        .filter((m) => m.id !== 'greeting-initial')
        .slice(-12)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          text: m.text,
        }));

      // Invoke Edge Function
      const { data, error } = await supabase.functions.invoke('quick-responder', {
        body: {
          message: trimmed,
          history,
          ...(propertyId ? { property_id: propertyId } : {}),
        },
      });

      if (error) {
        // Edge function returned non-2xx status code or failed
        console.warn('AI Support quick-responder non-2xx response:', error.message);
        const fallbackText = isGuidePreview
          ? t('aiSupport.error')
          : t('aiSupport.adminForwarded') ||
            'Your message has been received. Our support team has been notified and an admin will assist you here shortly.';
        const fallbackMessage: ChatMessage = {
          id: `ai-fallback-${Date.now()}`,
          sender: 'ai',
          text: fallbackText,
          timestamp: Date.now(),
        };
        const finalMessages = [...updatedMessages, fallbackMessage];
        setMessages(finalMessages);
      } else {
        const replyText =
          data?.reply ||
          data?.message ||
          data?.response ||
          (isGuidePreview
            ? t('aiSupport.error')
            : t('aiSupport.adminForwarded') ||
              'Your message has been received. Our team will assist you shortly.');

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: replyText,
          timestamp: Date.now(),
        };

        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
      }
    } catch (err) {
      console.warn('AI Support edge function error:', err);
      const fallbackMessage: ChatMessage = {
        id: `ai-fallback-${Date.now()}`,
        sender: 'ai',
        text: isGuidePreview
          ? t('aiSupport.error')
          : t('aiSupport.adminForwarded') ||
            'Your message has been received. Our support team has been notified and an admin will assist you here shortly.',
        timestamp: Date.now(),
      };
      const finalMessages = [...updatedMessages, fallbackMessage];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const suggestions = isGuidePreview
    ? [
        t('aiSupport.guideSuggestionWifi'),
        t('aiSupport.guideSuggestionCheckIn'),
        t('aiSupport.guideSuggestionRules'),
        t('aiSupport.guideSuggestionNearby'),
      ]
    : [
        t('aiSupport.suggestionHosting') || 'How does hosting work?',
        t('aiSupport.suggestionCollab') || 'How do creator collaborations work?',
        t('aiSupport.suggestionPricing') || 'How much does Nomadiqe cost?',
        t('aiSupport.suggestionCreatorEarnings') || 'How do I earn as a Creator?',
        t('aiSupport.suggestionSupport') || 'How to contact human support?',
      ];

  // Theme colors
  const bgColor = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const cardBg = isDark ? theme.colors.dark.secondaryBackground : '#FFFFFF';
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondaryColor = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const bubbleAiBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const bubbleAiBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const headerBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const adminBadgeText = t('aiSupport.adminBadge') || 'Support Team';

  // Memoized renderItem for FlatList
  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageBubbleItem
        item={item}
        isDark={isDark}
        textColor={textColor}
        secondaryColor={secondaryColor}
        bubbleAiBg={bubbleAiBg}
        bubbleAiBorder={bubbleAiBorder}
        adminBadgeText={adminBadgeText}
      />
    ),
    [isDark, textColor, secondaryColor, bubbleAiBg, bubbleAiBorder, adminBadgeText]
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <>
      {/* Floating Action Button Trigger */}
      {showFab && (
        <TouchableOpacity
          style={[styles.fabButton, fabStyle]}
          onPress={handleOpen}
          activeOpacity={0.85}
          accessibilityLabel={t('aiSupport.title') || 'Madi'}
        >
          <LinearGradient
            colors={[theme.colors.primary.blue, theme.colors.primary.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Minimizable Chat Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
        onRequestClose={handleMinimize}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: bgColor }]} edges={['top', 'bottom']}>
          {/* Header Bar */}
          <View style={[styles.header, { borderBottomColor: headerBorder }]}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={[theme.colors.primary.blue, theme.colors.primary.purple]}
                style={styles.avatarGradient}
              >
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.headerTitle, { color: textColor }]}>
                  {t('aiSupport.title') || 'Madi'}
                </Text>
                <View style={styles.statusRow}>
                  <View style={styles.onlineDot} />
                  <Text style={[styles.headerSubtitle, { color: secondaryColor }]}>
                    {isGuidePreview
                      ? t('aiSupport.guidePreviewSubtitle')
                      : t('aiSupport.subtitle') || 'Our virtual AI assistant'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={handleMinimize}
                style={[
                  styles.headerIconBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                ]}
                hitSlop={8}
                accessibilityLabel={t('aiSupport.minimize') || 'Minimize'}
              >
                <Ionicons name="chevron-down" size={20} color={textColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat Messages List */}
          <KeyboardAvoidingView
            style={styles.flexOne}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={Platform.OS === 'android'}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListFooterComponent={
                <>
                  {/* Quick Suggestions */}
                  {messages.length <= 1 && !isLoading && (
                    <View style={styles.suggestionsContainer}>
                      <Text style={[styles.suggestionsHeader, { color: secondaryColor }]}>
                        {t('aiSupport.suggestions') || t('common.suggestions') || 'Suggested questions:'}
                      </Text>
                      {suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.suggestionPill,
                            {
                              backgroundColor: cardBg,
                              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            },
                          ]}
                          onPress={() => handleSuggestionPress(suggestion)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.colors.primary.blue} />
                          <Text style={[styles.suggestionText, { color: textColor }]}>
                            {suggestion}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* AI Thinking Indicator */}
                  {isLoading && (
                    <View style={styles.thinkingWrap}>
                      <LinearGradient
                        colors={[theme.colors.primary.blue, theme.colors.primary.purple]}
                        style={styles.miniAvatar}
                      >
                        <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                      </LinearGradient>
                      <View style={[styles.thinkingBubble, { backgroundColor: bubbleAiBg, borderColor: bubbleAiBorder }]}>
                        <ActivityIndicator size="small" color={theme.colors.primary.blue} />
                        <Text style={[styles.thinkingText, { color: secondaryColor }]}>
                          {t('aiSupport.thinking') || 'Madi is thinking...'}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              }
            />

            {/* Isolated Input Bar */}
            <ChatInputBar
              onSend={sendMessage}
              isLoading={isLoading}
              isDark={isDark}
              placeholder={t('aiSupport.placeholder') || 'Type your question...'}
              secondaryColor={secondaryColor}
              textColor={textColor}
              inputBg={inputBg}
              headerBorder={headerBorder}
              insetsBottom={insets.bottom}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

/** Backward-compatible export alias */
export const AiInput = AiSupportWidget;

const styles = StyleSheet.create({
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.headline,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34C759',
  },
  headerSubtitle: {
    ...theme.typography.caption2,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  userMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  userBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userMessageText: {
    color: '#FFFFFF',
    ...theme.typography.body,
    fontSize: 15,
    lineHeight: 20,
  },
  userTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    ...theme.typography.caption2,
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  aiMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  aiAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  aiMessageText: {
    ...theme.typography.body,
    fontSize: 15,
    lineHeight: 21,
  },
  aiTimeText: {
    ...theme.typography.caption2,
    fontSize: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  adminMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  adminAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  adminBadgeText: {
    ...theme.typography.caption2,
    fontWeight: '700',
    fontSize: 11,
  },
  adminMessageText: {
    ...theme.typography.body,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  suggestionsHeader: {
    ...theme.typography.caption1,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  suggestionText: {
    ...theme.typography.subheadline,
    fontWeight: '500',
    flex: 1,
  },
  thinkingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  thinkingText: {
    ...theme.typography.caption1,
    fontStyle: 'italic',
  },
  inputBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputFieldWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8,
    ...theme.typography.body,
    fontSize: 15,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});
