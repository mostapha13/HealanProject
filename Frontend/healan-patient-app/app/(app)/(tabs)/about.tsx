import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScreen, LoadingBlock, SurfaceCard } from '../../../src/components/Ui';
import { useSite } from '../../../src/site/SiteContext';
import { colors, fonts, spacing } from '../../../src/theme';

export default function AboutTabScreen() {
  const { content, loading, refresh } = useSite();
  const { about } = content;

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <Text style={styles.topTitle}>درباره ما</Text>
        <Text style={styles.topSub}>{about.doctorName}</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={colors.primaryDeep} />
        }
      >
        {loading && !about.p1 ? (
          <LoadingBlock />
        ) : (
          <>
            <SurfaceCard>
              <Text style={styles.badge}>{about.badge}</Text>
              <Text style={styles.title}>{about.title}</Text>
              <Text style={styles.specialty}>{about.specialty}</Text>
              <Text style={styles.board}>{about.board}</Text>
            </SurfaceCard>

            {about.p1 ? (
              <SurfaceCard style={{ marginTop: spacing.sm }}>
                <Text style={styles.para}>{about.p1}</Text>
              </SurfaceCard>
            ) : null}

            {about.p2 ? (
              <SurfaceCard style={{ marginTop: spacing.sm }}>
                <Text style={styles.para}>{about.p2}</Text>
              </SurfaceCard>
            ) : null}

            {about.quote ? (
              <View style={styles.quoteBox}>
                <Text style={styles.quote}>{about.quote}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    backgroundColor: colors.primaryDeep,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.white,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  topSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    marginTop: 4,
  },
  body: { padding: spacing.md, paddingBottom: spacing.xxl },
  badge: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primaryDeep,
    textAlign: 'right',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'right',
    marginTop: 6,
  },
  specialty: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'right',
    marginTop: 8,
  },
  board: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 8,
    lineHeight: 22,
  },
  para: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
    lineHeight: 24,
  },
  quoteBox: {
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    padding: spacing.md,
    borderRightWidth: 4,
    borderRightColor: colors.primaryDeep,
  },
  quote: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.primaryDeep,
    textAlign: 'right',
    lineHeight: 24,
  },
});
