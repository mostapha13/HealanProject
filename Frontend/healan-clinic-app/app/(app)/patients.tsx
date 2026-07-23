import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { fetchPatients, patientDisplayName, type PatientSummary } from '../../src/api/healan';
import {
  Card,
  EmptyBlock,
  LoadingBlock,
  Muted,
  Screen,
  SearchField,
  Title,
} from '../../src/components/Ui';

export default function PatientsScreen() {
  const { getAccessToken } = useAuth();
  const [filter, setFilter] = useState('');
  const [items, setItems] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await fetchPatients(getAccessToken, { filterText: filter.trim() || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت بیماران');
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
      <Title>بیماران</Title>
      <SearchField
        placeholder="نام یا کد ملی..."
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
          keyExtractor={(item) => String(item.patientId)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          ListEmptyComponent={<EmptyBlock label={error ?? 'بیماری یافت نشد'} />}
          renderItem={({ item }) => (
            <Card>
              <Text style={{ fontWeight: '700', textAlign: 'right', color: '#1A2433' }}>
                {patientDisplayName(item)}
              </Text>
              <Muted>کد ملی: {item.nationalCode}</Muted>
              <Muted>موبایل: {item.phoneNumber}</Muted>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
