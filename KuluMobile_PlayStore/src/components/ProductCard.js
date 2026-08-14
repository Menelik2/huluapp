import React, {memo, useCallback} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';

function ProductCard({item, onPress, onAdd, addLabel}) {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);
  const handleAdd = useCallback(() => onAdd(item), [item, onAdd]);

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.9} onPress={handlePress}>
      {item.image_url ? (
        <Image
          source={{uri: item.image_url}}
          style={s.img}
          resizeMode="cover"
          // Reduce decode cost on Android lists
          fadeDuration={0}
        />
      ) : (
        <View style={[s.img, s.imgPh]} />
      )}
      <Text style={s.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={s.price}>ETB {item.price}</Text>
      <TouchableOpacity style={s.add} onPress={handleAdd} hitSlop={8}>
        <Text style={s.addT}>{addLabel || "Add"}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function propsAreEqual(prev, next) {
  return (
    prev.item.id === next.item.id &&
    prev.item.price === next.item.price &&
    prev.item.stock_quantity === next.item.stock_quantity &&
    prev.item.image_url === next.item.image_url &&
    prev.item.title === next.item.title &&
    prev.onPress === next.onPress &&
    prev.onAdd === next.onAdd && prev.addLabel === next.addLabel
  );
}

export default memo(ProductCard, propsAreEqual);

const s = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  img: {width: '100%', height: 120, borderRadius: 10, backgroundColor: '#e2e8f0'},
  imgPh: {},
  title: {fontWeight: '700', marginTop: 8, color: '#0f172a', minHeight: 36},
  price: {color: '#2563eb', fontWeight: '800', marginTop: 2},
  add: {
    marginTop: 8,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 8,
  },
  addT: {color: '#fff', textAlign: 'center', fontWeight: '800'},
});
