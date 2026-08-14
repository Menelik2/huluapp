import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {api} from '../../api/client';

export default function AdminCustomersScreen({navigation}) {
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return api
      .get('/admin/customers')
      .then((r) => setData(r.data.data || r.data || []))
      .catch((e) => Alert.alert('Error', e.response?.data?.message || e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={s.c}>
      <FlatList
        data={data}
        keyExtractor={(x) => String(x.id)}
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
        }
        renderItem={({item}) => (
          <View style={s.row}>
            <View style={{flex: 1}}>
              <Text style={s.b}>{item.name}</Text>
              <Text style={s.meta}>{item.email}</Text>
              <Text style={s.meta}>Orders: {item.orders_count ?? 0}</Text>
            </View>
            <TouchableOpacity
              style={s.chat}
              onPress={() =>
                navigation.navigate('ChatScreen', {receiverId: item.id})
              }>
              <Text style={s.chatT}>Chat</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No customers yet.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, padding: 16, backgroundColor: '#0f172a'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  b: {fontWeight: '700', color: '#f1f5f9'},
  meta: {color: '#94a3b8', fontSize: 12, marginTop: 2},
  chat: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chatT: {color: '#fff', fontWeight: '700'},
  empty: {textAlign: 'center', marginTop: 40, color: '#64748b'},
});
