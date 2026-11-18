import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { memberAccounts } from '../auth/memberAccounts';
import { store } from './index';
import { buildSample } from './sampleData';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  // Members who log in work inside the workspace of the person who created them.
  const wid = user?.workspaceId || user?.uid;
  const isAdmin = !!user && user.uid === wid;
  // Members only receive their own slice of the workspace (see firestore.rules).
  const memberId = user?.memberId;
  const scope = useMemo(() => (isAdmin || !user ? null : { memberId: memberId || '__none__' }), [isAdmin, user, memberId]);
  const [state, setState] = useState({ projects: [], tasks: [], members: [], clients: [], ready: false });

  useEffect(() => {
    if (!wid) return undefined;
    setState({ projects: [], tasks: [], members: [], clients: [], ready: false });
    return store.subscribe(wid, setState, scope);
  }, [wid, scope]);

  // Admins created before the role existed were labelled "Project Manager": relabel them once.
  useEffect(() => {
    if (!isAdmin || !state.ready) return;
    const flag = `pms.adminRoleFixed.${wid}`;
    try {
      if (localStorage.getItem(flag)) return;
      localStorage.setItem(flag, '1');
    } catch { /* storage unavailable: skip */ }
    const owner = state.members.find((m) => m.isOwner && m.role === 'Project Manager');
    if (owner) store.update(wid, 'members', owner.id, { role: 'Admin' });
  }, [isAdmin, state.ready, state.members, wid]);

  const value = useMemo(
    () => ({
      ...state,
      workspaceId: wid,
      isOwner: isAdmin,
      isAdmin,
      me: state.members.find((m) => m.uid && m.uid === user?.uid),
      add: (col, data) => store.add(wid, col, data),
      update: (col, id, patch) => store.update(wid, col, id, patch),
      remove: async (col, id) => {
        if (col === 'members') {
          const m = state.members.find((x) => x.id === id);
          if (m) await memberAccounts.removeAccount(m);
        }
        return store.remove(wid, col, id);
      },
      loadSample: () => store.addMany(wid, buildSample(state.members.find((m) => m.isOwner)?.id)),
      createMember: (data, password) => memberAccounts.createMember(wid, data, password),
      setMemberPassword: (member, password, revokeSessions) => memberAccounts.setPassword(wid, member, password, revokeSessions),
    }),
    [state, wid, user?.uid, isAdmin],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
