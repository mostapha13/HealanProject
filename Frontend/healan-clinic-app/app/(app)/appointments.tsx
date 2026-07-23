import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import {
  appointmentPatientLabel,
  fetchAppointments,
  type AppointmentSummary,
} from '../../src/api/healan';
import {
  Card,
  EmptyBlock,
  LoadingBlock,
  Muted,
  Screen,
  SearchField,
  Title,
} from '../../src/components/Ui';

export default function AppointmentsScreen() {
  const { getAccessToken } = useAuth();
  const [filter, setFilter] = useState('');
  const [items, setItems] = useState<AppointmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await fetchAppointments(getAccessToken, { filterText: filter.trim() || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت نوبت‌ها');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, filter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <Title>پذیرش و نوبت</Title>
      <SearchField
        placeholder="جستجو بیمار / کد ملی..."
        value={filter}
        onChangeText={setFilter}
        onSubmitEditing={() => {
          setLoading(true);
          void load();
        }}
        returnKeyType="search"
      />
      {loading && items.length === 0 ? (
        <LoadingBlock />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.appointmentId)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          ListEmptyComponent={<EmptyBlock label={error ?? 'نوبتی یافت نشد'} />}
          renderItem={({ item }) => (
            <Card>
              <Text style={{ fontWeight: '700', textAlign: 'right', color: '#1A2433' }}>
                {appointmentPatientLabel(item)}
              </Text>
              <Muted>
                {item.appointmentTypeName ?? 'نوبت'} · {item.doctorName ?? `پزشک #${item.doctorId}`}
              </Muted>
              <Muted>{item.appointmentDate}</Muted>
              {item.note ? <Muted>{item.note}</Muted> : null}
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
