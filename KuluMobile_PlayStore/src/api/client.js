import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../config';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

const TOKEN_KEY = 'kulu_token';
const USER_KEY = 'kulu_user';

export function setToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = 'Bearer ' + token;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function persistSession(user, token) {
  setToken(token);
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token || ''],
    [USER_KEY, JSON.stringify(user || null)],
  ]);
}

export async function loadSession() {
  const pairs = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  const map = Object.fromEntries(pairs);
  const token = map[TOKEN_KEY];
  let user = null;
  try {
    user = map[USER_KEY] ? JSON.parse(map[USER_KEY]) : null;
  } catch (_) {
    user = null;
  }
  if (token) setToken(token);
  return {user, token};
}

export async function clearSession() {
  setToken(null);
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
