import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {api} from '../../api/client';

export default function AdminCategoriesScreen() {
  const [name, setName] = useState('');
  const [data, setData] = useState([]);
  const [editing, setEditing] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return api
      .get('/categories')
      .then((r) => setData(r.data))
      .catch((e) => Alert.alert('Error', e.response?.data?.message || e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await api.put('/admin/categories/' + editing.id, {name: name.trim()});
      } else {
        await api.post('/admin/categories', {name: name.trim()});
      }
      setName('');
      setEditing(null);
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setName(item.name);
  };

  const remove = (item) => {
    Alert.alert('Delete category', 'Delete "' + item.name + '"? Products in it will also be removed.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/admin/categories/' + item.id);
            load();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || e.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={s.c}>
      <Text style={s.h}>Categories</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={editing ? 'Edit category name' : 'New category name'}
        style={s.input}
      />
      <View style={s.rowBtns}>
        <TouchableOpacity style={s.btn} onPress={save}>
          <Text style={s.btnT}>{editing ? 'Update' : 'Add category'}</Text>
        </TouchableOpacity>
        {editing ? (
          <TouchableOpacity
            style={[s.btn, s.cancel]}
            onPress={() => {
              setEditing(null);
              setName('');
            }}>
            <Text style={s.btnT}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.meta}>{item.products_count ?? 0} products</Text>
            </View>
            <TouchableOpacity style={s.act} onPress={() => startEdit(item)}>
              <Text style={s.actT}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.act, s.del]} onPress={() => remove(item)}>
              <Text style={s.actT}>Del</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, padding: 16, backgroundColor: '#f8fafc'},
  h: {fontSize: 24, fontWeight: '800', marginBottom: 12},
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  rowBtns: {flexDirection: 'row', gap: 8, marginBottom: 12},
  btn: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
  },
  cancel: {backgroundColor: '#64748b'},
  btnT: {color: '#fff', textAlign: 'center', fontWeight: '700'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
  },
  name: {fontWeight: '700'},
  meta: {color: '#64748b', fontSize: 12},
  act: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  del: {backgroundColor: '#dc2626'},
  actT: {color: '#fff', fontWeight: '700', fontSize: 12},
});
