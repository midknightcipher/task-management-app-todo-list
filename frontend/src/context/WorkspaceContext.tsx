import React, {
  createContext, useContext, useEffect,
  useState, useCallback, useRef,
} from 'react';
import { Workspace, WorkspaceMember } from '../types';
import { workspaceAPI } from '../services/api';
import { authService } from '../services/auth';

interface WorkspaceContextType {
  workspaceId: string | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  members: WorkspaceMember[];
  loading: boolean;
  setWorkspaceId: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaceId: null,
  workspaces: [],
  currentWorkspace: null,
  members: [],
  loading: true,
  setWorkspaceId: () => {},
  refreshWorkspaces: async () => {},
  refreshMembers: async () => {},
});

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces]     = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const [members, setMembers]           = useState<WorkspaceMember[]>([]);
  const [loading, setLoading]           = useState(true);

  // Prevent StrictMode double-fetch: only allow one in-flight request at a time
  const fetchingRef = useRef(false);

  const setWorkspaceId = useCallback((id: string) => {
    localStorage.setItem('workspaceId', id);
    setWorkspaceIdState(id);
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    // De-duplicate concurrent calls (React 18 StrictMode fires effects twice)
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const res = await workspaceAPI.getAll();
      const ws: Workspace[] = Array.isArray(res.data) ? res.data : [];
      setWorkspaces(ws);

      if (ws.length > 0) {
        const stored = localStorage.getItem('workspaceId');
        const isValid = stored != null && ws.some((w) => w.id === stored);
        if (isValid) {
          setWorkspaceIdState(stored);
        } else {
          // Stale or missing — auto-select personal workspace
          localStorage.setItem('workspaceId', ws[0].id);
          setWorkspaceIdState(ws[0].id);
        }
      } else {
        localStorage.removeItem('workspaceId');
        setWorkspaceIdState(null);
      }
    } catch {
      localStorage.removeItem('workspaceId');
      setWorkspaceIdState(null);
      setWorkspaces([]);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const refreshMembers = useCallback(async () => {
    if (!workspaceId) { setMembers([]); return; }
    try {
      const res = await workspaceAPI.getMembers(workspaceId);
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMembers([]);
    }
  }, [workspaceId]);

  useEffect(() => {
    setLoading(true);
    refreshWorkspaces().finally(() => setLoading(false));
  }, [refreshWorkspaces]);

  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  const currentWorkspace = workspaces.find((w) => w.id === workspaceId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaceId,
        workspaces,
        currentWorkspace,
        members,
        loading,
        setWorkspaceId,
        refreshWorkspaces,
        refreshMembers,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
