import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import {api} from '../api/client';
import {useI18n} from '../i18n/I18nContext';

export default function CartScreen({navigation, cart, setCart}) {
  const {t} = useI18n();
  const [shipping_name, setName] = useState('');
  const [shipping_phone, setPhone] = useState('');
  const [shipping_address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(() => cart.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0), [cart]);

  const changeQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((x) => {
          if (x.product_id !== productId) return x;
          const q = x.quantity + delta;
          if (q < 1) return null;
          if (q > x.stock_quantity) {
            Alert.alert(t('stockLimit'), t('noMoreStock'));
            return x;
          }
          return {...x, quantity: q};
        })
        .filter(Boolean),
    );
  };

  const startPayment = async (orderId) => {
    try {
      const res = await api.post('/payments/chapa/initialize', {order_id: orderId});
      const url = res.data.checkout_url;
      if (url) {
        await Linking.openURL(url);
        Alert.alert(
          t('completePayment'),
          'Finish payment in the browser (Chapa supports Telebirr, cards, banks). Then return to Orders and tap Verify payment.',
          [{text: 'Open Orders', onPress: () => navigation.navigate('Orders')}],
        );
      }
    } catch (e) {
      Alert.alert(
        'Payment init failed',
        e.response?.data?.message || e.message || 'You can pay later from Orders.',
      );
      navigation.navigate('Orders');
    }
  };

  const placeOrder = async () => {
    if (!cart.length) {
      Alert.alert('Cart empty', 'Add products first.');
      return;
    }
    if (!shipping_name.trim() || !shipping_phone.trim() || !shipping_address.trim()) {
      Alert.alert('Shipping required', 'Fill name, phone, and address.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.post('/orders', {
        shipping_name: shipping_name.trim(),
        shipping_phone: shipping_phone.trim(),
        shipping_address: shipping_address.trim(),
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      });
      const order = res.data;
      setCart([]);
      Alert.alert('Order placed', 'Pay now with Chapa (Telebirr / card / bank)?', [
        {text: 'Later', onPress: () => navigation.navigate('Orders')},
        {text: 'Pay now', onPress: () => startPayment(order.id)},
      ]);
    } catch (e) {
      Alert.alert('Order failed', e.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.c}>
      <FlatList
        data={cart}
        keyExtractor={(x) => String(x.product_id)}
        ListHeaderComponent={
          <Text style={s.h}>Your cart · ETB {total.toFixed(2)}</Text>
        }
        renderItem={({item}) => (
          <View style={s.row}>
            <View style={{flex: 1}}>
              <Text style={s.title}>{item.title}</Text>
              <Text>
                ETB {item.price} × {item.quantity}
              </Text>
            </View>
            <TouchableOpacity style={s.qbtn} onPress={() => changeQty(item.product_id, -1)}>
              <Text style={s.qbt}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.qbtn} onPress={() => changeQty(item.product_id, 1)}>
              <Text style={s.qbt}>+</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Cart is empty.</Text>}
        ListFooterComponent={
          cart.length ? (
            <View style={s.form}>
              <Text style={s.fh}>{t("shipping")}</Text>
              <TextInput
                style={s.input}
                placeholder={t("fullName")}
                value={shipping_name}
                onChangeText={setName}
              />
              <TextInput
                style={s.input}
                placeholder={t("phone")}
                keyboardType="phone-pad"
                value={shipping_phone}
                onChangeText={setPhone}
              />
              <TextInput
                style={[s.input, {height: 80}]}
                placeholder={t("address")}
                multiline
                value={shipping_address}
                onChangeText={setAddress}
              />
              <TouchableOpacity
                style={[s.place, submitting && {opacity: 0.6}]}
                disabled={submitting}
                onPress={placeOrder}>
                <Text style={s.placeT}>
                  {submitting ? 'Placing…' : 'Place order · ETB ' + total.toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, backgroundColor: '#f8fafc', padding: 16},
  h: {fontSize: 20, fontWeight: '800', marginBottom: 12},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  title: {fontWeight: '700'},
  qbtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  qbt: {fontSize: 20, fontWeight: '700'},
  empty: {textAlign: 'center', marginTop: 40, color: '#94a3b8'},
  form: {marginTop: 16},
  fh: {fontWeight: '800', marginBottom: 8, fontSize: 16},
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  place: {
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  placeT: {color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16},
});
