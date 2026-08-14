import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {api} from '../../api/client';
import {useAuth} from '../../context/AuthContext';
import {useI18n} from '../../i18n/I18nContext';
import LanguageToggle from '../../components/LanguageToggle';

const MENU = [
  {title: 'Orders', route: 'AdminOrders', desc: 'Status & fulfillment', color: '#3b82f6'},
  {title: 'Products', route: 'AdminProducts', desc: 'Catalog & images', color: '#22c55e'},
  {title: 'Categories', route: 'AdminCategories', desc: 'Organize catalog', color: '#a855f7'},
  {title: 'Inventory', route: 'AdminInventory', desc: 'Stock levels', color: '#f59e0b'},
  {title: 'Customers', route: 'AdminCustomers', desc: 'Buyers & chat', color: '#06b6d4'},
  {title: 'Analytics', route: 'AdminAnalytics', desc: 'Sales insights', color: '#6366f1'},
  {title: 'Reports', route: 'AdminReports', desc: 'Seller performance', color: '#f97316'},
  {title: 'Live Chat', route: 'ChatScreen', desc: 'Support messages', color: '#14b8a6'},
];

export default function AdminDashboardScreen({navigation}) {
  const {user, logout} = useAuth();
  const {t} = useI18n();
  const [overview, setOverview] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return api
      .get('/admin/overview')
      .then((r) => setOverview(r.data))
      .catch((e) => {
        const msg = e.response?.data?.message || e.message;
        if (e.response?.status === 403) {
          Alert.alert('Access denied', 'This account is not admin on the server.');
        } else {
          Alert.alert('Error', msg);
        }
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onLogout = () => {
    Alert.alert('Sign out', 'Leave the admin portal?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <ScrollView
      style={s.c}
      contentContainerStyle={{paddingBottom: 40}}
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
      }>
      <Text style={s.h}>{t('adminPortal')}</Text>
      <Text style={s.sub}>Signed in as {user?.name || user?.email || 'Admin'}</Text>
      <Text style={s.email}>{user?.email}</Text>

      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={s.statN}>{overview?.orders ?? '—'}</Text>
          <Text style={s.statL}>Orders</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statN}>{overview?.pending_orders ?? '—'}</Text>
          <Text style={s.statL}>Pending</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statN}>{overview?.products ?? '—'}</Text>
          <Text style={s.statL}>Products</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statN}>
            {overview?.sales != null ? Number(overview.sales).toFixed(0) : '—'}
          </Text>
          <Text style={s.statL}>Sales ETB</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statN}>{overview?.customers ?? '—'}</Text>
          <Text style={s.statL}>Customers</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statN}>{overview?.admins ?? '—'}</Text>
          <Text style={s.statL}>Admins</Text>
        </View>
      </View>

      <LanguageToggle light />
      <Text style={s.section}>{t('modules')}</Text>
      <View style={s.grid}>
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[s.card, {borderLeftColor: item.color}]}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.85}>
            <Text style={s.cardT}>{item.title}</Text>
            <Text style={s.cardD}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.out} onPress={onLogout}>
        <Text style={s.outT}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, backgroundColor: '#0f172a', padding: 16},
  h: {fontSize: 28, fontWeight: '900', color: '#f8fafc'},
  sub: {color: '#94a3b8', marginTop: 4},
  email: {color: '#64748b', marginBottom: 16, fontSize: 13},
  stats: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  stat: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statN: {fontSize: 22, fontWeight: '800', color: '#93c5fd'},
  statL: {color: '#94a3b8', marginTop: 2, fontSize: 13},
  section: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  card: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderColor: '#334155',
  },
  cardT: {color: '#f1f5f9', fontWeight: '800', fontSize: 15},
  cardD: {color: '#94a3b8', marginTop: 4, fontSize: 12},
  out: {
    marginTop: 12,
    backgroundColor: '#334155',
    padding: 14,
    borderRadius: 12,
  },
  outT: {color: '#fff', textAlign: 'center', fontWeight: '700'},
});
