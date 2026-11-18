// Firestore store. Layout (every user owns an isolated workspace):
//   users/{uid}                    -> profile
//   users/{uid}/projects/{id}
//   users/{uid}/tasks/{id}         -> { projectId, assigneeId, ... }
//   users/{uid}/members/{id}
import {
  addDoc, arrayRemove, collection, doc, getDocs, onSnapshot, query, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const col = (uid, name) => collection(db, 'users', uid, name);
const clean = (obj) => JSON.parse(JSON.stringify(obj)); // Firestore rejects `undefined`

export const firestoreStore = {
  /**
   * Admin: everything. A member (scope = { memberId }) only asks for what the security rules let them read:
   * projects they belong to, tasks assigned to them, and the members list. Clients are admin-only.
   */
  subscribe(uid, cb, scope) {
    const state = { projects: [], tasks: [], members: [], clients: [] };
    const names = scope ? ['projects', 'tasks', 'members'] : ['projects', 'tasks', 'members', 'clients'];
    const source = (name) => {
      if (!scope) return col(uid, name);
      if (name === 'projects') return query(col(uid, name), where('memberIds', 'array-contains', scope.memberId));
      if (name === 'tasks') return query(col(uid, name), where('assigneeId', '==', scope.memberId));
      return col(uid, name);
    };
    const loaded = new Set();
    const emit = () => cb({ ...state, ready: loaded.size === names.length });
    const unsubs = names.map((name) =>
      onSnapshot(
        source(name),
        (snap) => {
          state[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          loaded.add(name);
          emit();
        },
        (err) => {
          console.error(`Firestore listener failed for ${name}:`, err);
          loaded.add(name);
          emit();
        },
      ),
    );
    return () => unsubs.forEach((u) => u());
  },

  async add(uid, name, data) {
    const ref = await addDoc(col(uid, name), clean({ ...data, createdAt: Date.now() }));
    return ref.id;
  },

  async update(uid, name, id, patch) {
    await updateDoc(doc(db, 'users', uid, name, id), clean(patch));
  },

  /** Inserts many documents at once (used for the sample data). Ids are kept so records can reference each other. */
  async addMany(uid, collections) {
    const batch = writeBatch(db);
    let n = 0;
    Object.entries(collections).forEach(([name, items]) => {
      items.forEach(({ id, ...data }) => {
        batch.set(doc(db, 'users', uid, name, id), clean({ ...data, createdAt: data.createdAt || Date.now() }));
        n += 1;
      });
    });
    if (n > 450) throw new Error('Too many documents for a single batch.');
    await batch.commit();
  },

  async remove(uid, name, id) {
    const batch = writeBatch(db);
    if (name === 'projects') {
      const tasks = await getDocs(query(col(uid, 'tasks'), where('projectId', '==', id)));
      tasks.forEach((t) => batch.delete(t.ref));
    }
    if (name === 'members') {
      const tasks = await getDocs(query(col(uid, 'tasks'), where('assigneeId', '==', id)));
      tasks.forEach((t) => batch.update(t.ref, { assigneeId: '' }));
      const inProjects = await getDocs(query(col(uid, 'projects'), where('memberIds', 'array-contains', id)));
      inProjects.forEach((p) => batch.update(p.ref, { memberIds: arrayRemove(id) }));
      const leading = await getDocs(query(col(uid, 'projects'), where('responsibleId', '==', id)));
      leading.forEach((p) => batch.update(p.ref, { responsibleId: '' }));
    }
    batch.delete(doc(db, 'users', uid, name, id));
    await batch.commit();
  },
};
