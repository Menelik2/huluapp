import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {signInWithGoogle} from '../api/auth';
import {registerFcmToken} from '../api/notifications';
import {useI18n} from '../i18n/I18nContext';
import LanguageToggle from '../components/LanguageToggle';

export default function LoginScreen({onLogin}) {
  const {t} = useI18n();
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      const d = await signInWithGoogle();
      if (!d || !d.user) throw new Error('Login response missing user');
      onLogin(d.user);
      registerFcmToken().catch(() => {});
    } catch (e) {
      Alert.alert(
        t('error'),
        e.response?.data?.message || e.message || 'Could not sign in',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.c}>
      <Text style={s.logo}>{t('appName')}</Text>
      <Text style={s.t}>{t('tagline')}</Text>
      <Text style={s.sub}>{t('loginSub')}</Text>
      <TouchableOpacity disabled={loading} style={s.b} onPress={login}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.bt}>{t('signInGoogle')}</Text>
        )}
      </TouchableOpacity>
      <Text style={s.hint}>{t('loginHint')}</Text>
      <View style={{marginTop: 24, alignItems: 'center'}}>
        <LanguageToggle light />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  c: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#0f172a',
  },
  logo: {
    fontSize: 44,
    fontWeight: '900',
    textAlign: 'center',
    color: '#3b82f6',
    letterSpacing: -1,
  },
  t: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  sub: {
    textAlign: 'center',
    color: '#94a3b8',
    marginBottom: 36,
    lineHeight: 22,
  },
  b: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  bt: {color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16},
  hint: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 20,
    fontSize: 13,
  },
});
