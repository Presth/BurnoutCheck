import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

type FirebaseExtraConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

type GoogleAuthExtraConfig = {
  clientId?: string;
  webClientId?: string;
};

function cleanConfigValue(value?: string) {
  return value?.replace(/"/g, '').trim();
}

const expoExtra =
  Constants.expoConfig?.extra ?? (Constants.manifest as any)?.extra ?? {};

const firebaseExtra =
  (expoExtra.firebase as FirebaseExtraConfig | undefined) ?? {};

const googleAuthExtra =
  (expoExtra.googleAuth as GoogleAuthExtraConfig | undefined) ??
  (expoExtra.google as GoogleAuthExtraConfig | undefined) ??
  {};

const firebaseConfig = {
  apiKey: cleanConfigValue(firebaseExtra.apiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanConfigValue(firebaseExtra.authDomain ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanConfigValue(firebaseExtra.projectId ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanConfigValue(firebaseExtra.storageBucket ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanConfigValue(firebaseExtra.messagingSenderId ?? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanConfigValue(firebaseExtra.appId ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
};

export const googleWebClientId = cleanConfigValue(
  googleAuthExtra.webClientId ??
    googleAuthExtra.clientId ??
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
);
export const firebaseProjectNumber = cleanConfigValue(firebaseConfig.messagingSenderId);

function isConfiguredGoogleClientId(clientId?: string) {
  return Boolean(clientId && !clientId.startsWith('YOUR_') && clientId.endsWith('.apps.googleusercontent.com'));
}

export function isGoogleWebClientIdForFirebaseProject(clientId = googleWebClientId) {
  if (!clientId || !firebaseProjectNumber) return false;
  return clientId.startsWith(`${firebaseProjectNumber}-`);
}

export const isFirebaseAppConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

export const isGoogleAuthConfigured = Boolean(
  isFirebaseAppConfigured &&
    isConfiguredGoogleClientId(googleWebClientId) &&
    isGoogleWebClientIdForFirebaseProject(googleWebClientId)
);

export const isFirebaseConfigured = isGoogleAuthConfigured;

function getAsyncStoragePersistence(storage: typeof AsyncStorage) {
  return class {
    static type = 'LOCAL';
    readonly type = 'LOCAL';

    async _isAvailable() {
      try {
        const key = '@firebase/auth-storage-check';
        await storage.setItem(key, '1');
        await storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }

    _set(key: string, value: unknown) {
      return storage.setItem(key, JSON.stringify(value));
    }

    async _get<T>(key: string): Promise<T | null> {
      const value = await storage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    }

    _remove(key: string) {
      return storage.removeItem(key);
    }

    _addListener() {}

    _removeListener() {}
  };
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (isFirebaseAppConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  try {
    auth = initializeAuth(app, {
      persistence: getAsyncStoragePersistence(AsyncStorage) as any,
    });
  } catch (error: any) {
    if (error?.code !== 'auth/already-initialized') {
      throw error;
    }
    auth = getAuth(app);
  }
  db = getFirestore(app);
} else {
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

export { app, auth, db };
