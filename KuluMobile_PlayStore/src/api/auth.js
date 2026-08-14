import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {FIREBASE_WEB_CLIENT_ID} from '../config';
import {api, setToken, persistSession, clearSession} from './client';

GoogleSignin.configure({webClientId: FIREBASE_WEB_CLIENT_ID});

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const result = await GoogleSignin.signIn();
  const idToken = result.data?.idToken || result.idToken;
  if (!idToken) throw new Error('Google did not return an ID token.');

  const credential = auth.GoogleAuthProvider.credential(idToken);
  await auth().signInWithCredential(credential);

  const response = await api.post('/auth/google', {id_token: idToken});
  const {user, token} = response.data;
  await persistSession(user, token);
  return response.data;
}

export async function signOut() {
  try {
    await GoogleSignin.signOut();
  } catch (_) {}
  try {
    await auth().signOut();
  } catch (_) {}
  await clearSession();
}
