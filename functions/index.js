// Server-side member account management. Only the Admin SDK can create users, set another
// user's password and revoke their sessions, so these run as callable Cloud Functions.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const auth = getAuth();
const db = getFirestore();

/** Caller must be signed in AND be the owner of their workspace (a member can't manage logins). */
async function requireOwner(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');
  const uid = request.auth.uid;
  const snap = await db.doc(`users/${uid}`).get();
  const workspaceId = (snap.exists && snap.data().workspaceId) || uid;
  if (workspaceId !== uid) throw new HttpsError('permission-denied', 'Only the workspace owner can manage member logins.');
  return uid;
}

function checkPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new HttpsError('invalid-argument', 'Password must be 8 to 128 characters.');
  }
}

async function createLogin(ownerUid, { name, email, phone }, password, memberId) {
  const clean = String(email || '').trim().toLowerCase();
  let user;
  try {
    user = await auth.createUser({ email: clean, password, displayName: name });
  } catch (e) {
    if (e.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'An account with this email already exists.');
    if (e.code === 'auth/invalid-email') throw new HttpsError('invalid-argument', 'Enter a valid email address.');
    throw new HttpsError('internal', 'Could not create the login.');
  }
  await db.doc(`users/${user.uid}`).set({
    uid: user.uid, name, email: clean, phone: phone || '', photoURL: '', provider: 'password',
    workspaceId: ownerUid, memberId, createdAt: Date.now(),
  });
  await db.doc(`emailIndex/${clean}`).set({ uid: user.uid });
  return user.uid;
}

const MEMBER_FIELDS = ['name', 'email', 'phone', 'role', 'department', 'hourlyRate', 'currency', 'avatar'];
const pick = (obj) => Object.fromEntries(MEMBER_FIELDS.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

exports.createMember = onCall(async (request) => {
  const ownerUid = await requireOwner(request);
  const member = pick(request.data?.member || {});
  const password = request.data?.password || '';
  if (!member.name || !member.email) throw new HttpsError('invalid-argument', 'Name and email are required.');

  const ref = db.collection(`users/${ownerUid}/members`).doc();
  let uid = '';
  if (password) {
    checkPassword(password);
    uid = await createLogin(ownerUid, member, password, ref.id);
  }
  await ref.set({ ...member, status: 'active', uid, hasLogin: !!uid, createdAt: Date.now() });
  return { id: ref.id, uid };
});

exports.setMemberPassword = onCall(async (request) => {
  const ownerUid = await requireOwner(request);
  const { memberId, password, revokeSessions } = request.data || {};
  checkPassword(password);

  const ref = db.doc(`users/${ownerUid}/members/${memberId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Member not found.');
  const member = snap.data();
  if (member.isOwner) throw new HttpsError('failed-precondition', 'Change your own password from your account instead.');

  // Member without a login yet: setting a password creates one.
  if (!member.uid) {
    const uid = await createLogin(ownerUid, member, password, memberId);
    await ref.update({ uid, hasLogin: true });
    return { created: true };
  }

  await auth.updateUser(member.uid, { password });
  if (revokeSessions) {
    // Invalidates refresh tokens, and stamps the profile so open sessions sign themselves out right away
    // (otherwise an already-issued ID token would stay valid for up to an hour).
    await auth.revokeRefreshTokens(member.uid);
    await db.doc(`users/${member.uid}`).set({ sessionsRevokedAt: Date.now() }, { merge: true });
  }
  return { created: false };
});

exports.deleteMemberAccount = onCall(async (request) => {
  const ownerUid = await requireOwner(request);
  const snap = await db.doc(`users/${ownerUid}/members/${request.data?.memberId}`).get();
  if (!snap.exists) return { ok: true };
  const { uid, email, isOwner } = snap.data();
  if (isOwner) throw new HttpsError('failed-precondition', 'The owner account cannot be deleted here.');
  if (uid) {
    try {
      await auth.deleteUser(uid);
    } catch (e) {
      if (e.code !== 'auth/user-not-found') throw e;
    }
    await db.doc(`users/${uid}`).delete();
    if (email) await db.doc(`emailIndex/${String(email).toLowerCase()}`).delete();
  }
  return { ok: true };
});
