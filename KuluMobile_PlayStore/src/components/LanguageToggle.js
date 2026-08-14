import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useI18n} from '../i18n/I18nContext';

export default function LanguageToggle({light}) {
  const {lang, setLang, t} = useI18n();
  return (
    <View style={s.row}>
      <Text style={[s.label, light && s.light]}>{t('language')}:</Text>
      <TouchableOpacity
        style={[s.chip, lang === 'en' && s.on]}
        onPress={() => setLang('en')}>
        <Text style={[s.chipT, lang === 'en' && s.onT]}>{t('english')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.chip, lang === 'am' && s.on]}
        onPress={() => setLang('am')}>
        <Text style={[s.chipT, lang === 'am' && s.onT]}>{t('amharic')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6},
  label: {color: '#64748b', marginRight: 4, fontWeight: '600'},
  light: {color: '#94a3b8'},
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  on: {backgroundColor: '#2563eb'},
  chipT: {fontWeight: '700', color: '#334155', fontSize: 12},
  onT: {color: '#fff'},
});
