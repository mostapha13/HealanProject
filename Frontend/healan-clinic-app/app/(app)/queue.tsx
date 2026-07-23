import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import {
  appointmentPatientLabel,
  fetchTodayAppointments,
  type AppointmentSummary,
} from '../../src/api/healan';
import { Card, EmptyBlock, LoadingBlock, Muted, Screen, Title } from '../../src/components/Ui';

export default function QueueScreen() {
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<AppointmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await fetchTodayAppointments(getAccessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت صف');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <Title>صف انتظار امروز</Title>
      <Muted>نوبت‌های جاری کلینیک</Muted>
      {loading && items.length === 0 ? (
        <LoadingBlock />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.appointmentId)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          ListEmptyComponent={<EmptyBlock label={error ?? 'نوبتی در صف نیست'} />}
          renderItem={({ item }) => (
            <Card>
              <Text style={{ fontWeight: '700', textAlign: 'right', color: '#1A2433' }}>
                {appointmentPatientLabel(item)}
              </Text>
              <Muted>
                {item.appointmentTypeName ?? 'نوبت'} · {item.doctorName ?? `پزشک #${item.doctorId}`}
              </Muted>
              <Muted>{item.appointmentDate}</Muted>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
