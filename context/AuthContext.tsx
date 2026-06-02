import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import {
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  auth,
  firebaseProjectNumber,
  googleWebClientId,
  isFirebaseAppConfigured,
  isFirebaseConfigured,
  isGoogleAuthConfigured,
  isGoogleWebClientIdForFirebaseProject,
} from '@/services/firebase';
import { saveUserProfile, seedDemoDataIfEmpty } from '@/services/firestore';
import { DEMO_USER } from '@/lib/dummyData';
import type { UserProfile } from '@/types';

const DEMO_SESSION_KEY = '@burnoutcheck/demo_session';

type GoogleAuthExtraConfig = {
  clientId?: string;
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
};

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isConfiguredClientId(clientId?: string) {
  return Boolean(clientId && !clientId.startsWith('YOUR_') && clientId.endsWith('.apps.googleusercontent.com'));
}

function getGoogleAuthConfigError(clientId?: string) {
  if (!isFirebaseAppConfigured) {
    return 'Firebase is not configured. Use demo mode or add your .env credentials.';
  }

  if (!clientId) {
    return 'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Firebase Auth needs the Google Web client ID to validate sign-in tokens.';
  }

  if (!isGoogleWebClientIdForFirebaseProject(clientId)) {
    return `Google webClientId does not match this Firebase project. Expected a client ID that starts with ${firebaseProjectNumber}-.`;
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(!isGoogleAuthConfigured);

  const expoExtra =
    Constants.expoConfig?.extra ?? (Constants.manifest as any)?.extra ?? {};

  const googleAuth =
    (expoExtra.googleAuth as GoogleAuthExtraConfig | undefined) ??
    (expoExtra.google as GoogleAuthExtraConfig | undefined) ??
    {};

  const webClientId = isConfiguredClientId(googleAuth.webClientId)
    ? googleAuth.webClientId
    : (isConfiguredClientId(googleAuth.clientId)
      ? googleAuth.clientId
      : googleWebClientId);

  const iosClientId = isConfiguredClientId(googleAuth.iosClientId)
    ? googleAuth.iosClientId
    : undefined;

  useEffect(() => {
    if (isGoogleAuthConfigured) {
      GoogleSignin.configure({
        scopes: ['profile', 'email'],
        webClientId: webClientId || undefined,
        iosClientId: iosClientId,
        offlineAccess: false,
      });
    }
  }, [webClientId, iosClientId]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      AsyncStorage.getItem(DEMO_SESSION_KEY).then((stored) => {
        if (stored) {
          setUser(JSON.parse(stored));
          seedDemoDataIfEmpty(DEMO_USER.uid);
        }
        setLoading(false);
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Student',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };
        await saveUserProfile(profile);
        setUser(profile);
        setIsDemoMode(false);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Use demo mode or add your .env credentials.');
    }

    try {
      setAuthActionLoading(true);

      const configError = getGoogleAuthConfigError(webClientId);
      if (configError) throw new Error(configError);

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();

      if (result.type !== 'success') {
        return;
      }

      const idToken =
        result.data.idToken ?? (await GoogleSignin.getTokens()).idToken;

      if (!idToken) {
        throw new Error('Google sign-in did not return an ID token.');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        console.warn('Google Sign In is already in progress.');
        return;
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error('Google Play Services are not available or outdated.');
        return;
      }
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setAuthActionLoading(false);
    }
  }, [webClientId]);

  const signInDemo = useCallback(async () => {
    await seedDemoDataIfEmpty(DEMO_USER.uid);
    await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
    setIsDemoMode(true);
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoMode || !isFirebaseConfigured) {
      await AsyncStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      return;
    }
    try {
      setAuthActionLoading(true);
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        console.warn('Error signing out of Google:', error);
      }
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setAuthActionLoading(false);
    }
  }, [isDemoMode]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || authActionLoading,
        isDemoMode,
        signInWithGoogle,
        signInDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
