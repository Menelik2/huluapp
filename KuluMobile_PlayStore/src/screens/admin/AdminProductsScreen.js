import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  RefreshControl,
  Switch,
  ActivityIndicator,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {api} from '../../api/client';

export default function AdminProductsScreen() {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [categoryId, setCategoryId] = useState(null);
  const [active, setActive] = useState(true);
  const [imageAsset, setImageAsset] = useState(null);

  const load = useCallback(async () => {
    try {
      const [prod, c] = await Promise.all([
        api.get('/admin/products'),
        api.get('/categories'),
      ]);
      setData(prod.data.data || prod.data);
      setCategories(c.data || []);
      if (!categoryId && (c.data || []).length) {
        setCategoryId(c.data[0].id);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    }
  }, [categoryId]);

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setStock('0');
    setActive(true);
    setImageAsset(null);
    setShowForm(false);
  };

  const openEdit = (item) => {
    setEditing(item);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setPrice(String(item.price ?? ''));
    setStock(String(item.stock_quantity ?? 0));
    setCategoryId(item.category_id || categoryId);
    setActive(item.active !== false);
    setImageAsset(null);
    setShowForm(true);
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1600,
      maxHeight: 1600,
    });
    if (result.didCancel || !result.assets?.length) return;
    setImageAsset(result.assets[0]);
  };

  const save = async () => {
    if (!title.trim() || !description.trim() || !price || !categoryId) {
      Alert.alert('Missing fields', 'Title, description, price, and category are required.');
      return;
    }
    if (!editing && !imageAsset) {
      Alert.alert('Image required', 'Pick a product image.');
      return;
    }

    const form = new FormData();
    form.append('title', title.trim());
    form.append('description', description.trim());
    form.append('price', String(price));
    form.append('stock_quantity', String(parseInt(stock, 10) || 0));
    form.append('category_id', String(categoryId));
    if (editing) {
      form.append('active', active ? '1' : '0');
    }
    if (imageAsset) {
      form.append('image', {
        uri: imageAsset.uri,
        type: imageAsset.type || 'image/jpeg',
        name: imageAsset.fileName || 'product.jpg',
      });
    }

    try {
      setSaving(true);
      if (editing) {
        form.append('_method', 'PUT');
        await api.post('/admin/products/' + editing.id, form, {
          headers: {'Content-Type': 'multipart/form-data'},
          transformRequest: (data, headers) => {
            // Let RN set the multipart boundary
            if (headers && headers['Content-Type']) {
              delete headers['Content-Type'];
            }
            return data;
          },
        });
      } else {
        await api.post('/admin/products', form, {
          headers: {'Content-Type': 'multipart/form-data'},
          transformRequest: (data, headers) => {
            if (headers && headers['Content-Type']) {
              delete headers['Content-Type'];
            }
            return data;
          },
        });
      }
      resetForm();
      await load();
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.data?.errors && JSON.stringify(e.response.data.errors)) ||
        e.message;
      Alert.alert('Save failed', String(msg));
    } finally {
      setSaving(false);
    }
  };

  const remove = (item) => {
    Alert.alert('Delete product', 'Delete "' + item.title + '"?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/admin/products/' + item.id);
            load();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || e.message);
          }
        },
      },
    ]);
  };

  if (showForm) {
    return (
      <ScrollView style={s.c} keyboardShouldPersistTaps="handled">
        <Text style={s.h}>{editing ? 'Edit product' : 'New product'}</Text>

        <Text style={s.label}>Title</Text>
        <TextInput style={s.input} value={title} onChangeText={setTitle} />

        <Text style={s.label}>Description</Text>
        <TextInput
          style={[s.input, {height: 90}]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={s.label}>Price (ETB)</Text>
        <TextInput
          style={s.input}
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={s.label}>Stock</Text>
        <TextInput
          style={s.input}
          keyboardType="number-pad"
          value={stock}
          onChangeText={setStock}
        />

        <Text style={s.label}>Category</Text>
        <View style={s.chips}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[s.chip, categoryId === c.id && s.chipOn]}
              onPress={() => setCategoryId(c.id)}>
              <Text style={[s.chipT, categoryId === c.id && s.chipTOn]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {editing ? (
          <View style={s.rowSwitch}>
            <Text style={s.label}>Active</Text>
            <Switch value={active} onValueChange={setActive} />
          </View>
        ) : null}

        <TouchableOpacity style={s.imgBtn} onPress={pickImage}>
          <Text style={s.imgBtnT}>
            {imageAsset ? 'Change image' : editing ? 'Replace image (optional)' : 'Pick image'}
          </Text>
        </TouchableOpacity>
        {imageAsset?.uri ? (
          <Image source={{uri: imageAsset.uri}} style={s.preview} />
        ) : editing?.image_url ? (
          <Image source={{uri: editing.image_url}} style={s.preview} />
        ) : null}

        <TouchableOpacity
          style={[s.save, saving && {opacity: 0.6}]}
          disabled={saving}
          onPress={save}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.saveT}>{editing ? 'Update' : 'Create product'}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={s.cancel} onPress={resetForm}>
          <Text style={s.cancelT}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={s.c}>
      <View style={s.header}>
        <Text style={s.h}>Products</Text>
        <TouchableOpacity style={s.add} onPress={() => setShowForm(true)}>
          <Text style={s.addT}>+ Add</Text>
        </TouchableOpacity>
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
          <View style={s.card}>
            {item.image_url ? (
              <Image source={{uri: item.image_url}} style={s.thumb} />
            ) : (
              <View style={[s.thumb, s.ph]} />
            )}
            <View style={{flex: 1}}>
              <Text style={s.b}>{item.title}</Text>
              <Text>
                ETB {item.price} · Stock {item.stock_quantity}
                {item.active === false ? ' · inactive' : ''}
              </Text>
              <View style={s.actions}>
                <TouchableOpacity style={s.act} onPress={() => openEdit(item)}>
                  <Text style={s.actT}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.act, s.del]} onPress={() => remove(item)}>
                  <Text style={s.actT}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No products yet.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, padding: 16, backgroundColor: '#f8fafc'},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  h: {fontSize: 24, fontWeight: '800', marginBottom: 12},
  add: {backgroundColor: '#16a34a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8},
  addT: {color: '#fff', fontWeight: '700'},
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  thumb: {width: 64, height: 64, borderRadius: 8, marginRight: 10},
  ph: {backgroundColor: '#e2e8f0'},
  b: {fontWeight: '700'},
  actions: {flexDirection: 'row', marginTop: 8, gap: 8},
  act: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  del: {backgroundColor: '#dc2626'},
  actT: {color: '#fff', fontWeight: '700', fontSize: 12},
  empty: {textAlign: 'center', marginTop: 40, color: '#94a3b8'},
  label: {fontWeight: '700', marginBottom: 4, marginTop: 8, color: '#334155'},
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4},
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  chipOn: {backgroundColor: '#2563eb'},
  chipT: {fontWeight: '600', color: '#334155'},
  chipTOn: {color: '#fff'},
  rowSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  imgBtn: {
    marginTop: 16,
    backgroundColor: '#64748b',
    padding: 14,
    borderRadius: 10,
  },
  imgBtnT: {color: '#fff', textAlign: 'center', fontWeight: '700'},
  preview: {width: '100%', height: 180, borderRadius: 12, marginTop: 12},
  save: {
    marginTop: 20,
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveT: {color: '#fff', fontWeight: '800', fontSize: 16},
  cancel: {marginTop: 10, marginBottom: 40, padding: 14},
  cancelT: {textAlign: 'center', color: '#64748b', fontWeight: '600'},
});
