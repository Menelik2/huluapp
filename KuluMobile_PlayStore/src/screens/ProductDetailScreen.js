import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useI18n} from '../i18n/I18nContext';

export default function ProductDetailScreen({route, cart, setCart}) {
  const product = route.params?.product;
  const {t} = useI18n();

  if (!product) {
    return (
      <View style={s.c}>
        <Text style={s.muted}>{t('productNotFound')}</Text>
      </View>
    );
  }

  const add = () => {
    if (product.stock_quantity < 1) {
      Alert.alert(t('outOfStock'));
      return;
    }
    setCart((prev) => {
      const existing = prev.find((x) => x.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          Alert.alert(t('stockLimit'), t('noMoreStock'));
          return prev;
        }
        return prev.map((x) =>
          x.product_id === product.id
            ? {...x, quantity: x.quantity + 1}
            : x,
        );
      }
      return prev.concat([
        {
          product_id: product.id,
          title: product.title,
          price: product.price,
          quantity: 1,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
        },
      ]);
    });
    Alert.alert(t('added'), product.title + ' ' + t('addedToCart'));
  };

  return (
    <ScrollView style={s.c} contentContainerStyle={{paddingBottom: 40}}>
      {product.image_url ? (
        <Image
          source={{uri: product.image_url}}
          style={s.img}
          resizeMode="cover"
        />
      ) : (
        <View style={[s.img, s.imgPh]} />
      )}
      <Text style={s.title}>{product.title}</Text>
      <Text style={s.price}>
        {t('etb')} {product.price}
      </Text>
      <Text style={s.meta}>
        {(product.category && product.category.name) || t('category')} ·{' '}
        {t('stock')} {product.stock_quantity}
      </Text>
      <Text style={s.desc}>{product.description || t('noDescription')}</Text>
      <TouchableOpacity
        style={[s.btn, product.stock_quantity < 1 && s.btnOff]}
        disabled={product.stock_quantity < 1}
        onPress={add}>
        <Text style={s.btnT}>
          {product.stock_quantity < 1 ? t('outOfStock') : t('addToCart')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, backgroundColor: '#f8fafc', padding: 16},
  img: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  imgPh: {marginBottom: 12},
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 14,
  },
  price: {fontSize: 20, fontWeight: '800', color: '#2563eb', marginTop: 6},
  meta: {color: '#64748b', marginTop: 6},
  desc: {color: '#334155', marginTop: 14, lineHeight: 22},
  btn: {
    marginTop: 24,
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 14,
  },
  btnOff: {backgroundColor: '#94a3b8'},
  btnT: {color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16},
  muted: {textAlign: 'center', marginTop: 40, color: '#94a3b8'},
});
