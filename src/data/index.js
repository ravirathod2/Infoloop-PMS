import { isFirebaseConfigured } from '../lib/firebase';
import { demoStore } from './demoStore';
import { firestoreStore } from './firestoreStore';

/** Firestore when the .env is filled in, otherwise a local demo store with identical API. */
export const store = isFirebaseConfigured ? firestoreStore : demoStore;
