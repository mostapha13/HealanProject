import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { colors } from '../src/theme';

export default function Index() {
  const { loading, session } = useAuth();
  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return <Redirect href={session ? '/(app)' : '/login'} />;
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
