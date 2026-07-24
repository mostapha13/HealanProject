import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';

function isIosSafari(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/.test(ua);
  return iOS && safari;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone) || window.matchMedia('(display-mode: standalone)').matches;
}

export function IosInstallBanner({ appName }: { appName: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      if (sessionStorage.getItem('healan-patient-ios-install-dismissed') === '1') return;
    } catch {
      /* ignore */
    }
    if (isIosSafari() && !isStandalone()) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.title}>نصب {appName} روی آیفون</Text>
        <Text style={styles.body}>
          در Safari دکمه Share (□↑) را بزنید و «Add to Home Screen» را انتخاب کنید تا اپ روی صفحه اصلی نصب
          شود.
        </Text>
        <Pressable
          onPress={() => {
            try {
              sessionStorage.setItem('healan-patient-ios-install-dismissed', '1');
            } catch {
              /* ignore */
            }
            setShow(false);
          }}
          style={styles.btn}
        >
          <Text style={styles.btnText}>متوجه شدم</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xl,
    zIndex: 1000,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: 6,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primaryInk,
  },
});
