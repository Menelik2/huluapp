import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {api} from '../../api/client';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersScreen() {
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return api
      .get('/admin/orders')
      .then((r) => setData(r.data.data || r.data))
      .catch((e) => Alert.alert('Error', e.response?.data?.message || e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = (order, status) => {
    Alert.alert('Update status', 'Set order #' + order.id + ' to ' + status + '?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await api.put('/admin/orders/' + order.id + '/status', {status});
            load();
          } catch (e) {
            Alert.alert('Failed', e.response?.data?.message || e.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={s.c}>
      <Text style={s.h}>Orders</Text>
      <FlatList
        data={data}
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
          <View style={s.row}>
            <Text style={s.b}>Order #{item.id}</Text>
            <Text>
              {item.status} · ETB {item.total_amount}
            </Text>
            <Text>{item.user?.email}</Text>
            <View style={s.actions}>
              {STATUSES.filter((st) => st !== item.status).map((st) => (
                <TouchableOpacity key={st} style={s.chip} onPress={() => setStatus(item, st)}>
                  <Text style={s.chipT}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, padding: 16, backgroundColor: '#0f172a'},
  h: {fontSize: 24, fontWeight: '800', marginBottom: 12},
  row: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    marginBottom: 8,
    borderRadius: 10,
  },
  b: {fontWeight: '800'},
  actions: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6},
  chip: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipT: {color: '#fff', fontSize: 12, fontWeight: '700'},
});
