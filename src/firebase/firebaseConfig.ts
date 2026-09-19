import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, browserPopupRedirectResolver, initializeAuth } from 'firebase/auth';
// @ts-expect-error — getReactNativePersistence only exists in the RN build of
// @firebase/auth (dist/rn/index.rn.d.ts); the package's "types" export condition
// always resolves to the shared web-only auth-public.d.ts ahead of the
// "react-native" condition, so TS can't see it even though it's present at
// runtime when Metro bundles this file for iOS/Android.
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(AsyncStorage),
  // Required for signInWithPopup (Google, etc.) — `initializeAuth` (unlike
  // the web-only `getAuth`) doesn't wire this up automatically, and without
  // it signInWithPopup fails immediately with `auth/argument-error`.
  ...(Platform.OS === 'web' ? { popupRedirectResolver: browserPopupRedirectResolver } : {}),
});

export const db = getFirestore(app);
