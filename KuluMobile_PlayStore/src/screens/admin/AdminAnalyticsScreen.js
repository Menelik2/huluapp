import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {api} from '../../api/client';

export default function AdminAnalyticsScreen() {
  const [d, setD] = useState(null);
  const [overview, setOverview] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, o] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/overview'),
      ]);
      setD(a.data);
      setOverview(o.data);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      style={s.c}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }>
      <Text style={s.h}>Analytics</Text>

      <Text style={s.section}>Overview</Text>
      <View style={s.card}>
        <Text>Products: {overview?.products ?? '—'}</Text>
        <Text>Orders: {overview?.orders ?? '—'}</Text>
        <Text>Pending: {overview?.pending_orders ?? '—'}</Text>
        <Text>Customers: {overview?.customers ?? '—'}</Text>
        <Text>Admins: {overview?.admins ?? '—'}</Text>
        <Text style={s.sales}>
          Sales: ETB {overview?.sales != null ? Number(overview.sales).toFixed(2) : '—'}
        </Text>
      </View>

      <Text style={s.section}>Orders by status</Text>
      <View style={s.card}>
        {(d?.orders_by_status || []).length === 0 ? (
          <Text style={s.muted}>No data</Text>
        ) : (
          (d.orders_by_status || []).map((x) => (
            <View key={x.status} style={s.row}>
              <Text style={s.status}>{x.status}</Text>
              <Text style={s.count}>{x.total}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={s.section}>Sales last 30 days</Text>
      <View style={s.card}>
        {(d?.sales_by_day || []).length === 0 ? (
          <Text style={s.muted}>No sales in the last 30 days</Text>
        ) : (
          (d.sales_by_day || []).map((x) => (
            <View key={x.day} style={s.row}>
              <Text>{x.day}</Text>
              <Text style={s.count}>ETB {Number(x.total).toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, padding: 16, backgroundColor: '#f8fafc'},
  h: {fontSize: 24, fontWeight: '800', marginBottom: 16},
  section: {fontWeight: '800', fontSize: 16, marginTop: 8, marginBottom: 8},
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sales: {marginTop: 8, fontWeight: '800', color: '#16a34a', fontSize: 16},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  status: {textTransform: 'capitalize', fontWeight: '600'},
  count: {fontWeight: '700'},
  muted: {color: '#94a3b8'},
});
