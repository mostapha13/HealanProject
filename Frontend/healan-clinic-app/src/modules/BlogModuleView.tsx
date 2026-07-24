import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { config } from '../config';
import { apiGet, apiPost, fetchAllPaginated, type PaginatedPage } from '../api/client';
import { uploadImageFromUri } from '../api/fileUpload';
import {
  AppScreen,
  EmptyBlock,
  FormField,
  FormModal,
  ListCard,
  LoadingBlock,
  PrimaryButton,
  SearchField,
  SwitchRow,
} from '../components/Ui';
import { colors, fonts, spacing } from '../theme';

type BlogForm = {
  blogPostId: number;
  title: string;
  excerpt: string;
  body: string;
  tags: string;
  coverImageUrl: string;
  coverImageFileId: string;
  isPublished: boolean;
};

const emptyForm = (): BlogForm => ({
  blogPostId: 0,
  title: '',
  excerpt: '',
  body: '',
  tags: '',
  coverImageUrl: config.defaultBlogCoverUrl,
  coverImageFileId: '',
  isPublished: false,
});

function wrapHtml(selection: string, open: string, close: string): string {
  return `${open}${selection || 'متن'}${close}`;
}

export function BlogModuleView({ title }: { title: string }) {
  const { getAccessToken } = useAuth();
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<BlogForm>(emptyForm());
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllPaginated((pageNumber, pageSize) =>
        apiGet<PaginatedPage<Record<string, unknown>>>(
          config.healanApiUrl,
          'BlogPost/List',
          getAccessToken,
          { pageNumber, pageSize, filterText: filter.trim() || undefined }
        )
      );
      setRows(list);
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'بارگذاری بلاگ ناموفق بود');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, getAccessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = async (raw: Record<string, unknown>) => {
    const id = Number(raw.blogPostId ?? raw.id);
    try {
      const detail = await apiGet<Record<string, unknown>>(
        config.healanApiUrl,
        'BlogPost/Info',
        getAccessToken,
        { blogPostId: id }
      );
      setForm({
        blogPostId: id,
        title: String(detail.title ?? ''),
        excerpt: String(detail.excerpt ?? ''),
        body: String(detail.body ?? ''),
        tags: String(detail.tags ?? ''),
        coverImageUrl: String(detail.coverImageUrl ?? config.defaultBlogCoverUrl),
        coverImageFileId: String(detail.coverImageFileId ?? ''),
        isPublished: Boolean(detail.isPublished),
      });
      setFormOpen(true);
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'بارگذاری مطلب ناموفق بود');
    }
  };

  const applyFormat = (open: string, close: string) => {
    const { start, end } = selection;
    const body = form.body;
    const selected = body.slice(start, end);
    const next = body.slice(0, start) + wrapHtml(selected, open, close) + body.slice(end);
    setForm({ ...form, body: next });
  };

  const pickCover = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('دسترسی', 'برای انتخاب تصویر، دسترسی گالری لازم است');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploading(true);
    try {
      const uploaded = await uploadImageFromUri(getAccessToken, result.assets[0].uri);
      setForm((prev) => ({
        ...prev,
        coverImageUrl: uploaded.link,
        coverImageFileId: uploaded.fileId,
      }));
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'آپلود تصویر ناموفق بود');
    } finally {
      setUploading(false);
    }
  };

  const useDefaultCover = () => {
    setForm((prev) => ({
      ...prev,
      coverImageUrl: config.defaultBlogCoverUrl,
      coverImageFileId: '',
    }));
  };

  const save = async () => {
    if (!form.title.trim()) {
      Alert.alert('خطا', 'عنوان الزامی است');
      return;
    }
    if (!form.body.trim()) {
      Alert.alert('خطا', 'متن مطلب الزامی است');
      return;
    }
    setSaving(true);
    try {
      await apiPost(config.healanApiUrl, 'BlogPost/Register', getAccessToken, {
        ...(form.blogPostId > 0 ? { blogPostId: form.blogPostId } : {}),
        title: form.title.trim(),
        // slug خالی → سرور از عنوان می‌سازد
        excerpt: form.excerpt.trim() || undefined,
        body: form.body.trim(),
        tags: form.tags.trim() || undefined,
        coverImageUrl: form.coverImageUrl.trim() || config.defaultBlogCoverUrl,
        coverImageFileId: form.coverImageFileId || undefined,
        isPublished: form.isPublished,
        // publishedAt را نفرست تا سرور تاریخ موجود را حفظ کند / برای مطلب جدید خودش بگذارد
      });
      setFormOpen(false);
      await load();
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'ذخیره ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  const remove = (raw: Record<string, unknown>) => {
    const id = Number(raw.blogPostId ?? raw.id);
    Alert.alert('حذف مطلب', 'این مطلب حذف شود؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await apiPost(config.healanApiUrl, 'BlogPost/Delete', getAccessToken, {
                blogPostId: id,
              });
              await load();
            } catch (err) {
              Alert.alert('خطا', err instanceof Error ? err.message : 'حذف ناموفق بود');
            }
          })();
        },
      },
    ]);
  };

  return (
    <AppScreen>
      <View style={styles.toolbar}>
        <PrimaryButton label="مطلب جدید" onPress={openNew} />
        <Text style={styles.heading}>{title}</Text>
      </View>
      <SearchField value={filter} onChangeText={setFilter} placeholder="جستجو در بلاگ..." />
      {loading ? (
        <LoadingBlock />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, index) => String(item.blogPostId ?? item.id ?? index)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={<EmptyBlock title="مطلبی نیست" />}
          renderItem={({ item }) => {
            const published = Boolean(item.isPublished);
            return (
              <ListCard
                title={String(item.title ?? 'مطلب')}
                lines={[
                  String(item.excerpt ?? item.tags ?? '').slice(0, 100),
                  String(item.tags ?? ''),
                ].filter(Boolean)}
                badge={published ? 'منتشر' : 'پیش‌نویس'}
                badgeTone={published ? 'ok' : 'neutral'}
                onPress={() => void openEdit(item)}
                onLongPress={() => remove(item)}
              />
            );
          }}
        />
      )}

      <FormModal
        visible={formOpen}
        title={form.blogPostId > 0 ? 'ویرایش مطلب' : 'مطلب جدید'}
        onClose={() => setFormOpen(false)}
        onSave={() => void save()}
        saving={saving}
      >
          <FormField
            label="عنوان"
            value={form.title}
            onChangeText={(v) => setForm({ ...form, title: v })}
          />
          <Text style={styles.hint}>نامک (slug) خودکار از عنوان ساخته می‌شود.</Text>
          <FormField
            label="برچسب‌ها"
            value={form.tags}
            onChangeText={(v) => setForm({ ...form, tags: v })}
            placeholder="قلب، فشارخون، پیشگیری"
          />
          <FormField
            label="خلاصه"
            value={form.excerpt}
            onChangeText={(v) => setForm({ ...form, excerpt: v })}
            multiline
          />

          <Text style={styles.label}>تصویر شاخص</Text>
          {form.coverImageUrl ? (
            <Image source={{ uri: form.coverImageUrl }} style={styles.cover} resizeMode="cover" />
          ) : null}
          <View style={styles.row}>
            <Pressable style={styles.chip} onPress={() => void pickCover()} disabled={uploading}>
              <Ionicons name="image-outline" size={18} color={colors.primaryDeep} />
              <Text style={styles.chipText}>{uploading ? 'آپلود...' : 'انتخاب از گالری'}</Text>
            </Pressable>
            <Pressable style={styles.chip} onPress={useDefaultCover}>
              <Text style={styles.chipText}>تصویر پیش‌فرض</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>متن مطلب</Text>
          <View style={styles.row}>
            <Pressable style={styles.formatBtn} onPress={() => applyFormat('<b>', '</b>')}>
              <Text style={styles.formatBtnText}>B</Text>
            </Pressable>
            <Pressable style={styles.formatBtn} onPress={() => applyFormat('<i>', '</i>')}>
              <Text style={[styles.formatBtnText, { fontStyle: 'italic' }]}>I</Text>
            </Pressable>
            <Pressable style={styles.formatBtn} onPress={() => applyFormat('<u>', '</u>')}>
              <Text style={[styles.formatBtnText, { textDecorationLine: 'underline' }]}>U</Text>
            </Pressable>
            <Pressable
              style={styles.formatBtn}
              onPress={() => applyFormat('<h2>', '</h2>')}
            >
              <Text style={styles.formatBtnText}>H2</Text>
            </Pressable>
            <Pressable
              style={styles.formatBtn}
              onPress={() => applyFormat('<li>', '</li>')}
            >
              <Text style={styles.formatBtnText}>•</Text>
            </Pressable>
          </View>
          <TextInput
            value={form.body}
            onChangeText={(v) => setForm({ ...form, body: v })}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            multiline
            textAlign="right"
            placeholder="متن HTML مطلب..."
            placeholderTextColor={colors.muted}
            style={styles.bodyInput}
          />

          <SwitchRow
            label="نمایش در سایت"
            value={form.isPublished}
            onValueChange={(v) => setForm({ ...form, isPublished: v })}
          />
      </FormModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: 12,
  },
  heading: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, flex: 1, textAlign: 'right' },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  cover: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: colors.bg,
    marginBottom: 8,
  },
  row: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipText: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
  formatBtn: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  formatBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  bodyInput: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
});
