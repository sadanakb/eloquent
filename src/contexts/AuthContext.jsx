import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isOnline } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const handledRef = useRef(false);

  async function fetchOrCreateProfile(userId) {
    if (!supabase) return null;

    // Try to fetch existing profile
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) return data;

    // Create new profile for first-time users
    const { data: created } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        elo_rating: 1200,
        wins: 0,
        losses: 0,
        total_games: 0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return created || null;
  }

  async function setSession(session) {
    if (session?.user) {
      setUser(session.user);
      setIsAuthenticated(true);
      const p = await fetchOrCreateProfile(session.user.id);
      setProfile(p);
    } else {
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (!isOnline()) {
      setIsLoading(false);
      return;
    }

    // Listen to all auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handledRef.current = true;
        setSession(session);
      }
    );

    // Fallback: if onAuthStateChange doesn't fire within 2s, check manually
    const timeout = setTimeout(() => {
      if (!handledRef.current) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
        });
      }
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function signIn() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
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
