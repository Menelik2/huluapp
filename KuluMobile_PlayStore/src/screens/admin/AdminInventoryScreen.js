import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {api} from '../../api/client';

export default function AdminInventoryScreen() {
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [edits, setEdits] = useState({});

  const load = useCallback(() => {
    return api
      .get('/admin/inventory')
      .then((r) => {
        const rows = r.data.data || r.data;
        setData(rows);
        const map = {};
        rows.forEach((p) => {
          map[p.id] = String(p.stock_quantity);
        });
        setEdits(map);
      })
      .catch((e) => Alert.alert('Error', e.response?.data?.message || e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveStock = async (item) => {
    const qty = parseInt(edits[item.id], 10);
    if (Number.isNaN(qty) || qty < 0) {
      Alert.alert('Invalid stock', 'Enter a non-negative integer.');
      return;
    }
    try {
      await api.put('/admin/inventory/' + item.id, {stock_quantity: qty});
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    }
  };

  return (
    <View style={s.c}>
      <Text style={s.h}>Inventory</Text>
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
            <View style={{flex: 1}}>
              <Text style={s.b}>{item.title}</Text>
              <Text style={s.meta}>
                {item.category?.name || '—'} · ETB {item.price}
                {item.active === false ? ' · inactive' : ''}
              </Text>
            </View>
            <TextInput
              style={s.input}
              keyboardType="number-pad"
              value={edits[item.id] ?? String(item.stock_quantity)}
              onChangeText={(t) => setEdits((prev) => ({...prev, [item.id]: t}))}
            />
            <TouchableOpacity style={s.save} onPress={() => saveStock(item)}>
              <Text style={s.saveT}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No products.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, padding: 16, backgroundColor: '#f8fafc'},
  h: {fontSize: 24, fontWeight: '800', marginBottom: 12},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  b: {fontWeight: '700'},
  meta: {color: '#64748b', fontSize: 12, marginTop: 2},
  input: {
    width: 72,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 8,
    textAlign: 'center',
    marginHorizontal: 8,
    backgroundColor: '#fff',
  },
  save: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveT: {color: '#fff', fontWeight: '700'},
  empty: {textAlign: 'center', marginTop: 40, color: '#94a3b8'},
});
