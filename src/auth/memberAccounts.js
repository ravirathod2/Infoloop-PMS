// Login accounts for workspace members.
// Demo mode does this in the browser. With Firebase it must run on a server (Cloud Functions in /functions)
// because only the Admin SDK can create users, set another user's password and revoke their sessions.
import { httpsCallable } from 'firebase/functions';
import { demoAuth } from './demoAuth';
import { demoStore } from '../data/demoStore';
import { functions, isFirebaseConfigured } from '../lib/firebase';
import { store } from '../data';

const fail = (message, field) => Object.assign(new Error(message), { field });

const NO_FUNCTIONS = 'Could not reach the member-login service. The Cloud Functions are not deployed to this Firebase project yet. Deploy them with: npx firebase-tools deploy --only functions';

function mapCallableError(err) {
  const code = err?.code || '';
  // An undeployed function surfaces as not-found, or as a bare "internal" (the browser's request failed).
  const generic = /^(internal|unavailable|not[ -]?found|deadline[ -]?exceeded|failed to fetch|network)/i.test((err?.message || '').trim());
  if (/^functions\/(internal|unavailable|not-found|deadline-exceeded)$/.test(code) && generic) {
    return Object.assign(new Error(NO_FUNCTIONS), { noFunctions: true });
  }
  const message = (err?.message || 'Something went wrong.').replace(/^.*?:\s*/, (m) => (m.length < 30 && /functions|firebase/i.test(m) ? '' : m));
  return fail(message, code === 'functions/already-exists' ? 'email' : undefined);
}

const call = async (name, data) => {
  try {
    return (await httpsCallable(functions, name)(data)).data;
  } catch (e) {
    throw mapCallableError(e);
  }
};

const demo = {
  async createMember(workspaceId, data, password) {
    const id = await demoStore.add(workspaceId, 'members', { ...data, status: 'active', uid: '', hasLogin: false });
    if (password) {
      try {
        const uid = await demoAuth.createMemberAccount({ workspaceId, memberId: id, ...data, password });
        await demoStore.update(workspaceId, 'members', id, { uid, hasLogin: true });
      } catch (e) {
        await demoStore.remove(workspaceId, 'members', id);
        throw e;
      }
    }
    return id;
  },

  /** Sets a member's password. A member without a login yet gets one created. */
  async setPassword(workspaceId, member, password, revokeSessions) {
    if (member.uid) {
      await demoAuth.setPassword(member.uid, password, revokeSessions);
      return { created: false };
    }
    const uid = await demoAuth.createMemberAccount({ workspaceId, memberId: member.id, name: member.name, email: member.email, phone: member.phone, password });
    await demoStore.update(workspaceId, 'members', member.id, { uid, hasLogin: true });
    return { created: true };
  },

  async removeAccount(member) {
    if (member.uid) await demoAuth.deleteAccount(member.uid);
  },
};

const firebase = {
  async createMember(workspaceId, data, password) {
    // No password: just a team record (the admin can write members directly, no server needed).
    if (!password) return store.add(workspaceId, 'members', { ...data, status: 'active', uid: '', hasLogin: false });
    const res = await call('createMember', { member: data, password });
    return res.id;
  },
  setPassword: (_workspaceId, member, password, revokeSessions) =>
    call('setMemberPassword', { memberId: member.id, password, revokeSessions }),
  removeAccount: (member) => (member.uid ? call('deleteMemberAccount', { memberId: member.id }) : Promise.resolve()),
};

export const memberAccounts = isFirebaseConfigured ? firebase : demo;
