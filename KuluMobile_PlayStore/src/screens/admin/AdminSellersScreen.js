import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

/**
 * Seller role removed: Admin is the store owner / seller.
 * This screen is kept only so old navigation links do not crash.
 */
export default function AdminSellersScreen() {
  return (
    <View style={s.c}>
      <Text style={s.t}>Store owner model</Text>
      <Text style={s.b}>
        Kulu uses two roles only: customer (user) and admin. Admin manages
        products, inventory, and orders — there is no separate seller account.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, padding: 20, backgroundColor: '#0f172a', justifyContent: 'center'},
  t: {color: '#f8fafc', fontSize: 20, fontWeight: '800', marginBottom: 12},
  b: {color: '#94a3b8', lineHeight: 22},
});
