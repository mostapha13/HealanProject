import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/AuthContext';
import { ragAsk } from '../../../src/api/portal';
import { AppScreen } from '../../../src/components/Ui';
import { colors, fonts, spacing } from '../../../src/theme';

type Msg = { id: string; role: 'user' | 'bot'; text: string };

const SUGGESTIONS = [
  'آدرس مطب کجاست؟',
  'ساعات کاری چطور است؟',
  'چطور نوبت بگیرم؟',
  'آمادگی قبل از ویزیت',
];

const WELCOME =
  'سلام! من دستیار هوشمند مطب هستم. می‌توانید درباره خدمات، آدرس و نوبت بپرسید یا از پیشنهادهای سریع استفاده کنید.';

export default function AssistantTabScreen() {
  const { getAccessToken, session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'welcome', role: 'bot', text: WELCOME },
  ]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const sessionId = useRef(`patient-${Date.now()}`);
  const listRef = useRef<FlatList<Msg>>(null);

  const send = async (question?: string) => {
    const q = (question ?? text).trim();
    if (!q || busy) return;
    setText('');
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text: q }]);
    setBusy(true);
    try {
      const token = await getAccessToken();
      const res = await ragAsk(token, q, sessionId.current);
      setMessages((m) => [
        ...m,
        {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: res.answer || (res.requiresLogin ? 'برای ادامه وارد شوید.' : 'پاسخی یافت نشد.'),
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: 'bot',
          text: err instanceof Error ? err.message : 'خطا در دریافت پاسخ',
        },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>چت‌بات بیمار</Text>
            <Text style={styles.headerSub}>
              {session?.firstName ? `آنلاین · ${session.firstName}` : 'آنلاین · پاسخ‌گوی سوالات شما'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            messages.length <= 1 ? (
              <View style={styles.suggestions}>
                <Text style={styles.suggestTitle}>پیشنهاد سریع</Text>
                <View style={styles.suggestWrap}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable key={s} onPress={() => void send(s)} style={styles.suggestChip}>
                      <Text style={styles.suggestText}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[styles.row, item.role === 'user' ? styles.rowUser : styles.rowBot]}>
              {item.role === 'bot' ? (
                <View style={styles.miniAvatar}>
                  <Ionicons name="hardware-chip-outline" size={14} color={colors.primaryDeep} />
                </View>
              ) : null}
              <View
                style={[
                  styles.bubble,
                  item.role === 'user' ? styles.bubbleUser : styles.bubbleBot,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    item.role === 'user' && { color: '#9F1239' },
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            busy ? (
              <View style={styles.thinking}>
                <Text style={styles.thinkingText}>در حال فکر کردن...</Text>
              </View>
            ) : null
          }
        />

        <View style={styles.composerWrap}>
          <View style={styles.composer}>
            <Pressable
              onPress={() => void send()}
              disabled={busy || !text.trim()}
              style={[styles.sendBtn, (!text.trim() || busy) && { opacity: 0.45 }]}
            >
              <Ionicons name="send" size={18} color={colors.white} />
            </Pressable>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="سؤالتان را بنویسید..."
              placeholderTextColor={colors.muted}
              textAlign="right"
              style={styles.input}
              multiline
              onSubmitEditing={() => void send()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primaryDeep,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: spacing.md,
  },
  headerInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.white, textAlign: 'right' },
  headerSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    marginTop: 2,
  },
  list: { padding: spacing.md, paddingBottom: spacing.lg },
  suggestions: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  suggestTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryDeep,
    textAlign: 'right',
    marginBottom: 10,
  },
  suggestWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  suggestChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primaryDeep },
  row: { marginBottom: 12, maxWidth: '92%' },
  rowUser: { alignSelf: 'flex-start', flexDirection: 'row' },
  rowBot: { alignSelf: 'flex-end', flexDirection: 'row-reverse', gap: 8 },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  bubbleUser: {
    backgroundColor: '#FFE8EC',
    borderBottomLeftRadius: 6,
  },
  bubbleBot: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomRightRadius: 6,
    borderRightWidth: 3,
    borderRightColor: colors.primaryDeep,
  },
  bubbleText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 22,
    textAlign: 'right',
  },
  thinking: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  thinkingText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primaryDeep },
  composerWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  composer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: colors.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 8,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
