import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { config } from '../config';
import { apiGet, apiPost, fetchAllPaginated, type PaginatedPage } from '../api/client';
import {
  AppScreen,
  EmptyBlock,
  ListCard,
  LoadingBlock,
  PrimaryButton,
  SearchField,
} from '../components/Ui';
import { colors, fonts, spacing } from '../theme';
import { toPersianDigits } from '../utils/jalali';

type LogRow = {
  id: number;
  title: string;
  subtitle: string;
  raw: Record<string, unknown>;
};

export function RagChatLogsView({ title }: { title: string }) {
  const { getAccessToken } = useAuth();
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllPaginated((pageNumber, pageSize) =>
        apiGet<PaginatedPage<Record<string, unknown>>>(
          config.healanApiUrl,
          'RagKnowledge/ChatLogList',
          getAccessToken,
          { pageNumber, pageSize, filterText: filter.trim() || undefined }
        )
      );
      setRows(
        list.map((raw, index) => {
          const id = Number(raw.ragChatLogId ?? raw.id ?? index);
          return {
            id,
            title: String(raw.question ?? raw.userMessage ?? `گفتگو #${id}`).slice(0, 80),
            subtitle: String(
              raw.phoneNumber ?? raw.createDate ?? raw.createdAt ?? raw.answer ?? ''
            ).slice(0, 120),
            raw,
          };
        })
      );
      setSelected(new Set());
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'بارگذاری گفتگوها ناموفق بود');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, getAccessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteIds = async (ids: number[]) => {
    if (!ids.length) return;
    setBusy(true);
    try {
      await apiPost(config.healanApiUrl, 'RagKnowledge/ChatLogDelete', getAccessToken, {
        ragChatLogIds: ids,
      });
      await load();
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'حذف ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (ids: number[], label: string) => {
    Alert.alert('حذف گفتگو', label, [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => void deleteIds(ids),
      },
    ]);
  };

  const selectedCount = selected.size;
  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);

  return (
    <AppScreen>
      <Text style={styles.heading}>{title}</Text>
      <SearchField value={filter} onChangeText={setFilter} placeholder="جستجو در گفتگوها..." />
      <View style={styles.actions}>
        <PrimaryButton
          label={busy ? '...' : selectedCount ? `حذف انتخاب‌شده (${toPersianDigits(selectedCount)})` : 'حذف گروهی'}
          onPress={() => {
            if (!selectedCount) {
              Alert.alert('توجه', 'ابتدا چند گفتگو را انتخاب کنید');
              return;
            }
            confirmDelete(
              [...selected],
              `${toPersianDigits(selectedCount)} گفتگو حذف شود؟`
            );
          }}
          disabled={busy}
        />
        <Pressable
          style={styles.linkBtn}
          onPress={() =>
            setSelected((prev) =>
              prev.size === allIds.length ? new Set() : new Set(allIds)
            )
          }
        >
          <Text style={styles.linkText}>
            {selectedCount === allIds.length && allIds.length
              ? 'لغو انتخاب همه'
              : 'انتخاب همه'}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingBlock />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={<EmptyBlock title="گفتگویی نیست" />}
          renderItem={({ item }) => {
            const isOn = selected.has(item.id);
            return (
              <View style={styles.row}>
                <Pressable
                  onPress={() => toggle(item.id)}
                  style={[styles.check, isOn && styles.checkOn]}
                  accessibilityLabel="انتخاب"
                >
                  {isOn ? <Text style={styles.checkMark}>✓</Text> : null}
                </Pressable>
                <View style={styles.cardGrow}>
                  <ListCard
                    title={item.title}
                    lines={[item.subtitle]}
                    badge={isOn ? 'انتخاب' : undefined}
                    badgeTone={isOn ? 'info' : 'neutral'}
                    onPress={() => toggle(item.id)}
                    onLongPress={() =>
                      confirmDelete([item.id], 'این گفتگو حذف شود؟')
                    }
                  />
                </View>
              </View>
            );
          }}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.sm,
  },
  linkBtn: { paddingVertical: 8 },
  linkText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.primaryDeep },
  row: { flexDirection: 'row-reverse', alignItems: 'stretch', gap: 8 },
  cardGrow: { flex: 1 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.line,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkOn: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryDeep,
  },
  checkMark: { color: colors.primaryDeep, fontFamily: fonts.bold, fontSize: 14 },
});
