import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {
  ActivityIndicator,
  View,
  StatusBar,
  InteractionManager,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import CustomerTabs from './src/navigation/CustomerTabs';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminProductsScreen from './src/screens/admin/AdminProductsScreen';
import AdminCategoriesScreen from './src/screens/admin/AdminCategoriesScreen';
import AdminOrdersScreen from './src/screens/admin/AdminOrdersScreen';
import AdminInventoryScreen from './src/screens/admin/AdminInventoryScreen';
import AdminAnalyticsScreen from './src/screens/admin/AdminAnalyticsScreen';
import AdminCustomersScreen from './src/screens/admin/AdminCustomersScreen';
import AdminReportsScreen from './src/screens/admin/AdminReportsScreen';
import ChatScreen from './src/screens/ChatScreen';
import {loadSession} from './src/api/client';
import {
  registerFcmToken,
  attachForegroundHandler,
} from './src/api/notifications';
import {signOut} from './src/api/auth';
import {AuthProvider} from './src/context/AuthContext';
import {I18nProvider} from './src/i18n/I18nContext';

const Stack = createNativeStackNavigator();

const adminHeader = {
  headerStyle: {backgroundColor: '#0f172a'},
  headerTintColor: '#fff',
  headerTitleStyle: {fontWeight: '800'},
};

const navTheme = {
  dark: false,
  colors: {
    primary: '#2563eb',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
    notification: '#ef4444',
  },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    loadSession()
      .then(({user: u}) => {
        if (cancelled || !u) return;
        setUser(u);
        InteractionManager.runAfterInteractions(() => {
          registerFcmToken().catch(() => {});
          unsub = attachForegroundHandler();
        });
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let unsub = null;
    const task = InteractionManager.runAfterInteractions(() => {
      registerFcmToken().catch(() => {});
      unsub = attachForegroundHandler();
    });
    return () => {
      task.cancel?.();
      if (unsub) unsub();
    };
  }, [user]);

  const handleLogout = useCallback(async () => {
    await signOut();
    setUser(null);
    setCart([]);
  }, []);

  const authValue = useMemo(
    () => ({
      user,
      setUser,
      logout: handleLogout,
    }),
    [user, handleLogout],
  );

  if (booting) {
    return (
      <View style={bootStyles.box}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const isAdmin = user && user.role === 'admin';

  return (
    <I18nProvider>
      <AuthProvider value={authValue}>
        <StatusBar barStyle={isAdmin ? 'light-content' : 'dark-content'} />
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator>
            {!user ? (
              <Stack.Screen name="Login" options={{headerShown: false}}>
                {(p) => <LoginScreen {...p} onLogin={setUser} />}
              </Stack.Screen>
            ) : isAdmin ? (
              <>
                <Stack.Screen
                  name="AdminDashboard"
                  component={AdminDashboardScreen}
                  options={{title: 'Kulu Admin', ...adminHeader}}
                />
                <Stack.Screen
                  name="AdminOrders"
                  component={AdminOrdersScreen}
                  options={{title: 'Orders', ...adminHeader}}
                />
                <Stack.Screen
                  name="AdminProducts"
                  component={AdminProductsScreen}
                  options={{title: 'Products', ...adminHeader}}
                />
                <Stack.Screen
                  name="AdminCategories"
                  component={AdminCategoriesScreen}
                  options={{title: 'Categories', ...adminHeader}}
                />
                <Stack.Screen
                  name="AdminInventory"
                  component={AdminInventoryScreen}
                  options={{title: 'Inventory', ...adminHeader}}
                />
                <Stack.Screen
                  name="AdminAnalytics"
                  component={AdminAnalyticsScreen}
                  options={{title: 'Analytics', ...adminHeader}}
                />
                <Stack.Screen
                  name="AdminReports"
                  component={AdminReportsScreen}
                  options={{title: 'Reports', ...adminHeader}}
                />
                <Stack.Screen
                  name="AdminCustomers"
                  component={AdminCustomersScreen}
                  options={{title: 'Customers', ...adminHeader}}
                />
                <Stack.Screen
                  name="ChatScreen"
                  component={ChatScreen}
                  options={{title: 'Live Chat', ...adminHeader}}
                />
              </>
            ) : (
              <Stack.Screen name="CustomerRoot" options={{headerShown: false}}>
                {() => (
                  <CustomerTabs
                    user={user}
                    cart={cart}
                    setCart={setCart}
                    onLogout={handleLogout}
                  />
                )}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </I18nProvider>
  );
}

const bootStyles = {
  box: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
};
