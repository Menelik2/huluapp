import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {api} from '../../api/client';
import {useI18n} from '../../i18n/I18nContext';

export default function AdminReportsScreen() {
  const {t} = useI18n();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return api
      .get('/admin/reports')
      .then((r) => setData(r.data))
      .catch((e) =>
        Alert.alert(t('error'), e.response?.data?.message || e.message),
      );
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      style={s.c}
      contentContainerStyle={{paddingBottom: 40}}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor="#93c5fd"
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }>
      <Text style={s.h}>{t('reportsTitle')}</Text>
      <Text style={s.sub}>{t('reportsSub')}</Text>

      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={s.n}>
            {data?.revenue_paid != null
              ? Number(data.revenue_paid).toFixed(0)
              : '—'}
          </Text>
          <Text style={s.l}>{t('revenuePaid')}</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.n}>{data?.orders_paid ?? '—'}</Text>
          <Text style={s.l}>{t('ordersCount')}</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.n}>{data?.units_sold ?? '—'}</Text>
          <Text style={s.l}>{t('unitsSold')}</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.n}>{data?.customers ?? '—'}</Text>
          <Text style={s.l}>{t('customers')}</Text>
        </View>
      </View>

      <Text style={s.section}>{t('topProducts')}</Text>
      {(data?.top_products || []).map((row) => (
        <View style={s.row} key={String(row.product_id)}>
          <Text style={s.rowT}>
            {(row.product && row.product.title) || '#' + row.product_id}
          </Text>
          <Text style={s.rowM}>
            {row.units} u · ETB {Number(row.revenue || 0).toFixed(0)}
          </Text>
        </View>
      ))}
      {!data?.top_products?.length ? (
        <Text style={s.empty}>{t('noData')}</Text>
      ) : null}

      <Text style={s.section}>{t('lowStock')}</Text>
      {(data?.low_stock || []).map((p) => (
        <View style={s.row} key={String(p.id)}>
          <Text style={s.rowT}>{p.title}</Text>
          <Text style={[s.rowM, p.stock_quantity <= 2 && s.danger]}>
            {t('stock')}: {p.stock_quantity}
          </Text>
        </View>
      ))}
      {!data?.low_stock?.length ? (
        <Text style={s.empty}>{t('noData')}</Text>
      ) : null}

      <Text style={s.section}>{t('byStatus')}</Text>
      {(data?.orders_by_status || []).map((x) => (
        <View style={s.row} key={x.status}>
          <Text style={s.rowT}>{x.status}</Text>
          <Text style={s.rowM}>{x.total}</Text>
        </View>
      ))}

      <Text style={s.section}>{t('last30Days')}</Text>
      {(data?.sales_by_day || []).map((x) => (
        <View style={s.row} key={x.day}>
          <Text style={s.rowT}>{x.day}</Text>
          <Text style={s.rowM}>ETB {Number(x.total || 0).toFixed(0)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, backgroundColor: '#0f172a', padding: 16},
  h: {fontSize: 24, fontWeight: '900', color: '#f8fafc'},
  sub: {color: '#94a3b8', marginBottom: 14},
  stats: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  stat: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  n: {fontSize: 20, fontWeight: '800', color: '#93c5fd'},
  l: {color: '#94a3b8', fontSize: 12, marginTop: 2},
  section: {
    color: '#e2e8f0',
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowT: {color: '#f1f5f9', fontWeight: '700'},
  rowM: {color: '#94a3b8', marginTop: 2},
  danger: {color: '#fca5a5'},
  empty: {color: '#64748b', marginBottom: 8},
});
