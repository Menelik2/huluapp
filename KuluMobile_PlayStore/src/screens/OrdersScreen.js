import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {api} from '../api/client';
import {useI18n} from '../i18n/I18nContext';

export default function OrdersScreen() {
  const {t} = useI18n();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    return api
      .get('/orders')
      .then((r) => setOrders(r.data.data || r.data))
      .catch((e) => Alert.alert(t('error'), e.response?.data?.message || e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pay = async (order) => {
    try {
      setBusyId(order.id);
      const res = await api.post('/payments/chapa/initialize', {order_id: order.id});
      if (res.data.checkout_url) {
        await Linking.openURL(res.data.checkout_url);
      }
    } catch (e) {
      Alert.alert('Payment', e.response?.data?.message || e.message);
    } finally {
      setBusyId(null);
    }
  };

  const verify = async (order) => {
    if (!order.payment_tx_ref) {
      Alert.alert('No payment', 'Start payment first.');
      return;
    }
    try {
      setBusyId(order.id);
      const res = await api.get('/payments/chapa/verify/' + order.payment_tx_ref);
      Alert.alert('Payment status', res.data.status || 'unknown');
      load();
    } catch (e) {
      Alert.alert('Verify failed', e.response?.data?.message || e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={s.c}>
      <FlatList
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        
        data={orders}
        keyExtractor={(x) => String(x.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({item}) => (
          <View style={s.card}>
            <Text style={s.id}>Order #{item.id}</Text>
            <Text style={s.status}>
              {item.status} · {item.payment_status || 'unpaid'}
            </Text>
            <Text>ETB {item.total_amount}</Text>
            <Text style={s.ship}>
              {item.shipping_name} · {item.shipping_phone}
            </Text>
            {(item.items || []).map((it) => (
              <Text key={it.id} style={s.item}>
                • {it.product?.title || 'Product'} × {it.quantity}
              </Text>
            ))}
            {item.payment_status !== 'paid' && item.status !== 'cancelled' ? (
              <View style={s.actions}>
                <TouchableOpacity
                  style={s.btn}
                  disabled={busyId === item.id}
                  onPress={() => pay(item)}>
                  <Text style={s.btnT}>{busyId === item.id ? '…' : t('payChapa')}</Text>
                </TouchableOpacity>
                {item.payment_tx_ref ? (
                  <TouchableOpacity
                    style={[s.btn, s.secondary]}
                    disabled={busyId === item.id}
                    onPress={() => verify(item)}>
                    <Text style={s.btnT}>Verify payment</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No orders yet.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, padding: 16, backgroundColor: '#f8fafc'},
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  id: {fontWeight: '800', fontSize: 16},
  status: {
    color: '#2563eb',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginVertical: 4,
  },
  ship: {color: '#64748b', marginTop: 4},
  item: {marginTop: 2, color: '#334155'},
  empty: {textAlign: 'center', marginTop: 40, color: '#94a3b8'},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  btn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondary: {backgroundColor: '#2563eb'},
  btnT: {color: '#fff', fontWeight: '700'},
});
