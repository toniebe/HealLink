import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Send, Mic, Bot, AlertTriangle } from 'lucide-react-native';
import { get, post } from '../helper/apiHelper';
import { C } from '../helper/theme';
import CustomHeader from '../components/molecules/HeaderCustom';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  uuid: string;
  message: string;
  sender_type: 'user' | 'bot';
  sentiment_score: string;
  detected_emotion: string;
  is_flagged: boolean;
  created_at: string;
}

interface SendMessageResponse {
  success: boolean;
  message: string;
  data: {
    user_message: ChatMessage;
  };
  meta: {
    timestamp: string;
  };
}

interface GetMessagesResponse {
  success: boolean;
  message: string;
  data: ChatMessage[];
  meta: {
    timestamp: string;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ── Emotion Config ────────────────────────────────────────────────────────────

const emotionConfig: Record<
  string,
  { emoji: string; color: string; label: string }
> = {
  happy: { emoji: '😊', color: '#27AE60', label: 'Happy' },
  sad: { emoji: '😢', color: '#5B8DEF', label: 'Sad' },
  anxious: { emoji: '😰', color: C.orange, label: 'Anxious' },
  angry: { emoji: '😠', color: C.redLight, label: 'Angry' },
  neutral: { emoji: '😐', color: C.textMuted, label: 'Neutral' },
  stressed: { emoji: '😓', color: C.orange, label: 'Stressed' },
  calm: { emoji: '😌', color: C.primary, label: 'Calm' },
};

const getEmotion = (key: string) =>
  emotionConfig[key?.toLowerCase()] ?? {
    emoji: '🤔',
    color: C.textMuted,
    label: key,
  };

// ── Chat Bubble ───────────────────────────────────────────────────────────────

const ChatBubble: React.FC<{ item: ChatMessage }> = ({ item }) => {
  const isUser = item.sender_type === 'user';
  const emotion = getEmotion(item.detected_emotion);
  const sentimentVal = parseFloat(item.sentiment_score);

  return (
    <View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowBot,
      ]}
    >
      {!isUser && (
        <View style={styles.botAvatar}>
          <Bot size={16} color="#FFF" />
        </View>
      )}

      <View style={styles.bubbleWrapper}>
        {/* Flagged warning */}
        {item.is_flagged && (
          <View style={styles.flaggedBanner}>
            <AlertTriangle size={12} color={C.redLight} />
            <Text
              variant="labelSmall"
              style={{ color: C.redLight, marginLeft: 4 }}
            >
              This message requires attention
            </Text>
          </View>
        )}

        <Surface
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleBot,
            item.is_flagged && styles.bubbleFlagged,
          ]}
          elevation={1}
        >
          <Text
            variant="bodyMedium"
            style={[styles.bubbleText, isUser && styles.bubbleTextUser]}
          >
            {item.message}
          </Text>
        </Surface>

        {/* Emotion & Sentiment */}
        {item.detected_emotion ? (
          <View style={[styles.emotionRow, isUser && styles.emotionRowUser]}>
            <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
            <Text
              variant="labelSmall"
              style={[styles.emotionLabel, { color: emotion.color }]}
            >
              {emotion.label}
            </Text>
            {!isNaN(sentimentVal) && (
              <View
                style={[
                  styles.sentimentPill,
                  { backgroundColor: emotion.color + '20' },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={{ color: emotion.color, fontWeight: '700' }}
                >
                  {sentimentVal > 0 ? '+' : ''}
                  {sentimentVal.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        <Text
          variant="labelSmall"
          style={[styles.timestamp, isUser && styles.timestampUser]}
        >
          {new Date(item.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

// ── Typing Indicator ──────────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => (
  <View style={[styles.bubbleRow, styles.bubbleRowBot]}>
    <View style={styles.botAvatar}>
      <Bot size={16} color="#FFF" />
    </View>
    <Surface
      style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}
      elevation={1}
    >
      <View style={styles.typingDots}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, { opacity: 0.3 + i * 0.25 }]} />
        ))}
      </View>
    </Surface>
  </View>
);


// ── Main Screen ───────────────────────────────────────────────────────────────

const AIChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  // ── Load History ──────────────────────────────────────────────────────────────

  const loadMessages = useCallback(async (pageNum = 1) => {
    if (pageNum === 1) {
      setIsLoadingHistory(true);
    }

    const { data, error } = await get<GetMessagesResponse>('/chat/history', {
      page: pageNum,
      per_page: 20,
    });

    setIsLoadingHistory(false);

    if (error || !data?.success) {
      return;
    }

    const newMessages = data.data;
    setMessages(prev =>
      pageNum === 1 ? newMessages : [...newMessages, ...prev],
    );
    setHasMore(data.meta.current_page < data.meta.last_page);
    setPage(data.meta.current_page);
  }, []);

  useEffect(() => {
    loadMessages(1);
  }, [loadMessages]);

  // ── Send Message ──────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) {
      return;
    }

    setInputText('');
    setIsSending(true);

    // Optimistic message
    const tempMsg: ChatMessage = {
      uuid: `temp-${Date.now()}`,
      message: trimmed,
      sender_type: 'user',
      sentiment_score: '',
      detected_emotion: '',
      is_flagged: false,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    setIsTyping(true);

    const { data, error } = await post<SendMessageResponse>('/chat', {
      message: trimmed,
    });

    setIsTyping(false);
    setIsSending(false);

    if (error || !data?.success) {
      setMessages(prev => prev.filter(m => m.uuid !== tempMsg.uuid));
      return;
    }

    // Replace temp with real message
    setMessages(prev => {
      const filtered = prev.filter(m => m.uuid !== tempMsg.uuid);
      return [...filtered, data.data.user_message];
    });

    // Reload to get bot reply
    setTimeout(() => {
      loadMessages(1);
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 500);
  };

  // ── Load More ─────────────────────────────────────────────────────────────────

  const handleLoadMore = () => {
    if (hasMore && !isLoadingHistory) {
      loadMessages(page + 1);
    }
  };

  return (
    <View style={styles.safe} >
      <CustomHeader
        title="AI Health Assistant"
        subtitle="Online — Ready to consult"
        centerTitle
        showMenu
      />

      {/* Mood Bar */}
      {/* <MoodBar messages={messages} /> */}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {isLoadingHistory ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text
              variant="bodySmall"
              style={{ color: C.textMuted, marginTop: 8 }}
            >
              Loading chat history...
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.uuid}
            renderItem={({ item }) => <ChatBubble item={item} />}
            contentContainerStyle={styles.messageList}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={
              hasMore ? (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={handleLoadMore}
                >
                  <Text variant="labelSmall" style={{ color: C.primary }}>
                    Load previous messages
                  </Text>
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  Start Consultation
                </Text>
                <Text variant="bodySmall" style={styles.emptySubtitle}>
                  Tell us about your health condition or how you feel. Our AI is
                  ready to help.
                </Text>
              </View>
            }
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <Surface style={styles.inputWrapper} elevation={2}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor={C.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.micButton} activeOpacity={0.7}>
              <Mic size={20} color={C.textMuted} />
            </TouchableOpacity>
          </Surface>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Send size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },



  // Mood Bar
  moodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: C.card,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  moodEmoji: { fontSize: 22 },
  moodLabel: { color: C.textMuted },
  moodValue: { fontWeight: '700' },

  // Messages
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: { color: C.textMuted, textAlign: 'center', lineHeight: 20 },

  // Bubble
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowBot: { justifyContent: 'flex-start' },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  bubbleWrapper: { maxWidth: '75%' },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: C.card,
    borderBottomLeftRadius: 4,
  },
  bubbleFlagged: {
    borderWidth: 1,
    borderColor: C.redLight + '60',
  },
  bubbleText: { color: C.text, lineHeight: 20 },
  bubbleTextUser: { color: '#FFF' },

  // Flagged
  flaggedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },

  // Emotion
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  emotionRowUser: { justifyContent: 'flex-end' },
  emotionEmoji: { fontSize: 12 },
  emotionLabel: { fontSize: 11 },
  sentimentPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 2,
  },
  timestamp: {
    color: C.textMuted,
    fontSize: 10,
    marginTop: 3,
    paddingHorizontal: 2,
  },
  timestampUser: { textAlign: 'right' },

  // Typing
  typingBubble: { paddingVertical: 14 },
  typingDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    maxHeight: 120,
    paddingVertical: 4,
  },
  micButton: {
    paddingLeft: 8,
    paddingBottom: 4,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: C.primary + '60',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default AIChatScreen;
