import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * The project has no Firebase Storage bucket set up (only Auth + Firestore —
 * see firebase.json), and provisioning one requires the Blaze billing plan,
 * which isn't something to switch on unasked. So the photo itself — already
 * downsized to a small square JPEG data URL client-side before this is ever
 * called — is stored as a plain string field on its own Firestore document,
 * well under the 1MB document cap, and kept out of `progress/{uid}` so a
 * large-ish photo never has any bearing on that doc's own size headroom.
 */
export async function loadProfilePhoto(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'profilePhotos', uid));
  if (!snap.exists()) return null;
  return (snap.data().dataUrl as string | undefined) ?? null;
}

export async function saveProfilePhoto(uid: string, dataUrl: string): Promise<void> {
  await setDoc(doc(db, 'profilePhotos', uid), { dataUrl, updatedAt: new Date().toISOString() });
}

export async function deleteProfilePhoto(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'profilePhotos', uid));
}
