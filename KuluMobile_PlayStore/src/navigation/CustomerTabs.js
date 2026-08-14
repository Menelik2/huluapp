import React from 'react';
import {Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ChatScreen from '../screens/ChatScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import {useI18n} from '../i18n/I18nContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({label, focused}) {
  const map = {Shop: '🛍', Cart: '🛒', Orders: '📦', Chat: '💬'};
  return (
    <Text style={{fontSize: focused ? 20 : 18, opacity: focused ? 1 : 0.55}}>
      {map[label] || '•'}
    </Text>
  );
}

function ShopStack({user, cart, setCart, onLogout}) {
  const {t} = useI18n();
  return (
    <Stack.Navigator>
      <Stack.Screen name="ShopHome" options={{title: t('appName')}}>
        {(p) => (
          <HomeScreen
            {...p}
            user={user}
            cart={cart}
            setCart={setCart}
            onLogout={onLogout}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ProductDetail" options={{title: t('product')}}>
        {(p) => <ProductDetailScreen {...p} cart={cart} setCart={setCart} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function CustomerTabs({user, cart, setCart, onLogout}) {
  const {t} = useI18n();
  const cartCount = cart.reduce((n, i) => n + i.quantity, 0);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: route.name !== 'Shop',
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
          height: 58,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarLabelStyle: {fontWeight: '700', fontSize: 11},
        tabBarIcon: ({focused}) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}>
      <Tab.Screen name="Shop" options={{title: t('tabShop'), headerShown: false}}>
        {() => (
          <ShopStack
            user={user}
            cart={cart}
            setCart={setCart}
            onLogout={onLogout}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Cart"
        options={{
          title: t('tabCart'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}>
        {(p) => (
          <CartScreen {...p} user={user} cart={cart} setCart={setCart} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{title: t('tabOrders')}}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{title: t('tabChat')}}
      />
    </Tab.Navigator>
  );
}
