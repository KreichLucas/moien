import {
  EmailAuthProvider,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { deleteProfilePhoto, loadProfilePhoto, saveProfilePhoto } from './profilePhotoStorage';

export function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/email-already-in-use':
      return 'Esse e-mail já está em uso.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente mais tarde.';
    case 'auth/unauthorized-domain':
      return 'Este site ainda não está autorizado a fazer login.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela de login. Permita pop-ups para este site e tente de novo.';
    case 'auth/requires-recent-login':
      return 'Por segurança, confirme sua senha atual novamente.';
    default:
      return 'Algo deu errado. Tente novamente.';
  }
}

interface AuthContextValue {
  user: User | null;
  isAuthLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearAuthError: () => void;
  /**
   * The single source of truth for the user's profile photo — every avatar
   * in the app (dashboard header, module pages, Perfil itself) reads this
   * instead of loading/holding its own copy, so a change here is instantly
   * reflected everywhere. `undefined` while the initial load from Firestore
   * hasn't resolved yet (avoids a flash of the fallback initials before a
   * saved photo has had a chance to arrive); `null` once resolved with no
   * photo saved.
   */
  profilePhotoUrl: string | null | undefined;
  updateProfilePhoto: (dataUrl: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setProfilePhotoUrl(undefined);
      return;
    }
    let cancelled = false;
    setProfilePhotoUrl(undefined);
    loadProfilePhoto(user.uid).then((url) => {
      if (!cancelled) setProfilePhotoUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthError(mapAuthError(error.code));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setAuthError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name.trim() });
      // updateProfile mutates credential.user in place but doesn't reliably
      // re-fire onAuthStateChanged, so the dashboard could still show the
      // pre-name fallback until something else triggers a refresh — force
      // it here.
      setUser({ ...credential.user } as User);
    } catch (error: any) {
      setAuthError(mapAuthError(error.code));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
      setAuthError(mapAuthError(error.code));
      throw error;
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  // Firebase requires a recent sign-in before allowing a password change —
  // re-authenticating with the current password satisfies that (and, as a
  // side effect, is also how we verify the user actually knows it).
  const changePassword = async (currentPassword: string, newPassword: string) => {
    const current = auth.currentUser;
    if (!current?.email) throw new Error('no-authenticated-user');
    const credential = EmailAuthProvider.credential(current.email, currentPassword);
    await reauthenticateWithCredential(current, credential);
    await updatePassword(current, newPassword);
  };

  const clearAuthError = () => setAuthError(null);

  // Persists to Firestore first, then flips the shared state — every
  // avatar reading `profilePhotoUrl` re-renders with the new value (or the
  // fallback, for `null`) the moment this resolves, with no per-screen
  // wiring needed. Callers (Perfil's upload/remove actions) handle their
  // own optimistic UI / error messaging around the await.
  const updateProfilePhoto = async (dataUrl: string | null) => {
    if (!user) return;
    if (dataUrl) {
      await saveProfilePhoto(user.uid, dataUrl);
    } else {
      await deleteProfilePhoto(user.uid);
    }
    setProfilePhotoUrl(dataUrl);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthLoading,
        authError,
        signIn,
        signUp,
        signInWithGoogle,
        signOutUser,
        changePassword,
        clearAuthError,
        profilePhotoUrl,
        updateProfilePhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
