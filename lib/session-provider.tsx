import { createContext, useContext, useEffect, useState } from 'react';

interface SessionContextType {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'RESELLER' | 'USER';
    creditBalance: number;
  } | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  status: 'loading',
  refresh: async () => {}
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionContextType['user']>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ user, status, refresh: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);