import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isOnline } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  async function fetchProfile(userId) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch profile:', error.message);
    }
    return data || null;
  }

  const handleSession = useCallback(async (session) => {
    if (session?.user) {
      setUser(session.user);
      setIsAuthenticated(true);
      let p = await fetchProfile(session.user.id);
      if (!p && supabase) {
        const { data } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            elo_rating: 1200,
            wins: 0,
            losses: 0,
            total_games: 0,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        p = data || null;
      }
      setProfile(p);
    } else {
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isOnline()) {
      setIsLoading(false);
      return;
    }

    // 1. Subscribe to auth changes (catches future changes + INITIAL_SESSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    // 2. Also explicitly get session as backup
    //    This handles the case where INITIAL_SESSION already fired
    //    before our listener was registered
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        handleSession(session);
      }
    });

    // Clean hash fragments from URL (OAuth redirect leaves them)
    if (window.location.hash && window.location.hash.includes('access_token')) {
      // Small delay to let Supabase process the hash first
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
      }, 500);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSession]);

  async function signIn() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Sign-in failed:', error.message);
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign-out failed:', error.message);
  }

  async function updateProfile(updates) {
    if (!supabase || !user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) {
      console.error('Profile update failed:', error.message);
      return null;
    }
    setProfile(data);
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, profile, isAuthenticated, isLoading, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
