import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword,
  signInWithPopup, signOut as fbSignOut, updateProfile,
} from 'firebase/auth';
import { addDoc, collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

const fail = (message, field) => Object.assign(new Error(message), { field });

function mapError(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use':
      return fail('An account with this email already exists. Try logging in.', 'email');
    case 'auth/invalid-email':
      return fail('Enter a valid email address.', 'email');
    case 'auth/weak-password':
      return fail('Password must be at least 8 characters.', 'password');
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return fail('Incorrect email or password.', 'password');
    case 'auth/too-many-requests':
      return fail('Too many attempts. Please wait a moment and try again.');
    case 'auth/network-request-failed':
      return fail('Network error. Check your connection and try again.');
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return Object.assign(new Error(''), { silent: true });
    case 'auth/popup-blocked':
      return fail('The sign-in popup was blocked. Allow popups for this site and retry.');
    case 'auth/operation-not-allowed':
      return fail('This sign-in method is not enabled in the Firebase console yet.');
    case 'permission-denied':
      return fail('Firestore denied the request. Publish the rules from firestore.rules.');
    default:
      return fail(err?.message || 'Something went wrong. Please try again.');
  }
}

// While a sign-up is writing the profile, the auth listener waits so it never reads a half-created user.
let inflight = null;
const guarded = async (fn) => {
  inflight = fn();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
};

/** Creates users/{uid}, the email lookup entry and the owner's own member record. */
async function createWorkspace(user, { name, phone, provider }) {
  const email = user.email.toLowerCase();
  const profile = {
    uid: user.uid, workspaceId: user.uid, name, email, phone: phone || '', photoURL: user.photoURL || '', provider, createdAt: Date.now(),
  };
  await setDoc(doc(db, 'users', user.uid), profile);
  await setDoc(doc(db, 'emailIndex', email), { uid: user.uid });
  await addDoc(collection(db, 'users', user.uid, 'members'), {
    name, email, phone: phone || '', role: 'Admin', isOwner: true, createdAt: Date.now(),
  });
  return profile;
}

async function loadProfile(user) {
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) return snap.data();
  } catch (e) {
    console.warn('Could not read profile:', e);
  }
  return {
    uid: user.uid, workspaceId: user.uid, name: user.displayName || user.email, email: user.email, phone: user.phoneNumber || '', photoURL: user.photoURL || '',
  };
}

export const firebaseAuth = {
  subscribe(cb) {
    let stopWatching = () => {};
    const stop = onAuthStateChanged(auth, async (user) => {
      stopWatching();
      if (!user) return cb(null);
      if (inflight) await inflight.catch(() => {});
      const profile = await loadProfile(user);
      cb({ ...profile, workspaceId: profile.workspaceId || user.uid });

      // "Log out everywhere": the server stamps users/{uid}.sessionsRevokedAt; any session older than that ends immediately.
      const { authTime } = await user.getIdTokenResult();
      stopWatching = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        const revokedAt = snap.data()?.sessionsRevokedAt;
        if (revokedAt && revokedAt > Date.parse(authTime)) fbSignOut(auth);
      }, () => {});
    });
    return () => { stopWatching(); stop(); };
  },

  async signUpEmail({ name, email, phone, password }) {
    try {
      return await guarded(async () => {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        return createWorkspace(cred.user, { name: name.trim(), phone: phone.trim(), provider: 'password' });
      });
    } catch (e) {
      throw mapError(e);
    }
  },

  async signInEmail({ email, password }) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return loadProfile(cred.user);
    } catch (e) {
      throw mapError(e);
    }
  },

  /** Used for both "Sign up with Google" and "Log in with Google". */
  async signInGoogle() {
    try {
      return await guarded(async () => {
        const { user } = await signInWithPopup(auth, googleProvider);
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) return snap.data();
        return createWorkspace(user, { name: user.displayName || user.email, phone: user.phoneNumber || '', provider: 'google' });
      });
    } catch (e) {
      throw mapError(e);
    }
  },

  signOut: () => fbSignOut(auth),

  async userExists(email) {
    try {
      const snap = await getDoc(doc(db, 'emailIndex', email.trim().toLowerCase()));
      return snap.exists();
    } catch (e) {
      throw mapError(e);
    }
  },
};
