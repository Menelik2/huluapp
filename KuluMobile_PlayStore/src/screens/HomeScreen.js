import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {api} from '../api/client';
import ProductCard from '../components/ProductCard';
import {useI18n} from '../i18n/I18nContext';
import LanguageToggle from '../components/LanguageToggle';

const LIST_OPTS = {
  initialNumToRender: 8,
  maxToRenderPerBatch: 8,
  windowSize: 7,
  updateCellsBatchingPeriod: 50,
  removeClippedSubviews: true,
};

export default function HomeScreen({navigation, user, cart, setCart, onLogout}) {
  const {t} = useI18n();
  const [products, setProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return api
      .get('/products')
      .then((r) => setProducts(r.data.data || r.data || []))
      .catch((e) =>
        Alert.alert(t('error'), e.response?.data?.message || e.message),
      );
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const addToCart = useCallback(
    (product) => {
      if (product.stock_quantity < 1) {
        Alert.alert(t('outOfStock'), product.title);
        return;
      }
      setCart((prev) => {
        const existing = prev.find((x) => x.product_id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock_quantity) {
            Alert.alert(t('stockLimit'), t('stockLimit'));
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
    },
    [setCart, t],
  );

  const openDetail = useCallback(
    (product) => {
      navigation.navigate('ProductDetail', {product});
    },
    [navigation],
  );

  const keyExtractor = useCallback((item) => String(item.id), []);
  const renderItem = useCallback(
    ({item}) => (
      <ProductCard item={item} onPress={openDetail} onAdd={addToCart} />
    ),
    [openDetail, addToCart],
  );

  const cartCount = useMemo(
    () => cart.reduce((n, i) => n + i.quantity, 0),
    [cart],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <View style={s.top}>
          <View>
            <Text style={s.brand}>{t('appName')}</Text>
            <Text style={s.h}>
              {t('hi', {name: user?.name?.split(' ')[0] || t('shopper')})}
            </Text>
          </View>
          <TouchableOpacity onPress={onLogout}>
            <Text style={s.out}>{t('signOut')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.sub}>
          {cartCount
            ? t('cartItems', {n: cartCount})
            : t('browseRefresh')}
        </Text>
        <View style={{marginBottom: 10}}>
          <LanguageToggle />
        </View>
      </View>
    ),
    [user?.name, cartCount, onLogout, t],
  );

  return (
    <View style={s.c}>
      <FlatList
        data={products}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={s.row}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<Text style={s.empty}>{t('noProducts')}</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={s.listPad}
        {...LIST_OPTS}
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingTop: 8},
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  h: {fontSize: 22, fontWeight: '800', color: '#0f172a'},
  out: {color: '#64748b', fontWeight: '600'},
  sub: {color: '#94a3b8', marginBottom: 8, fontSize: 13},
  row: {justifyContent: 'space-between'},
  listPad: {paddingBottom: 24},
  empty: {textAlign: 'center', marginTop: 48, color: '#94a3b8'},
});
