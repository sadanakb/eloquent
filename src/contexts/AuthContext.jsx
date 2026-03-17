import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isOnline } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchProfile(userId) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Failed to fetch profile:', error.message);
      return null;
    }
    return data;
  }

  async function handleUserChange(sessionUser) {
    if (sessionUser) {
      setUser(sessionUser);
      setIsAuthenticated(true);
      let p = await fetchProfile(sessionUser.id);
      if (!p) {
        // Auto-create bare profile for new users
        const { data } = await supabase
          .from('profiles')
          .upsert({
            id: sessionUser.id,
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
  }

  useEffect(() => {
    if (!isOnline()) {
      setIsLoading(false);
      return;
    }

    // Supabase v2 automatically detects hash fragments from OAuth redirects
    // when getSession() is called. We must:
    // 1. Let Supabase process any hash params via getSession()
    // 2. Clean the URL AFTER processing (not before!)
    // 3. Show loading state until resolved

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('getSession error:', error.message);
      // Clean up OAuth hash params from URL after Supabase has processed them
      if (window.location.hash && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      handleUserChange(session?.user ?? null).finally(() => setIsLoading(false));
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleUserChange(session?.user ?? null);
        // After sign in, clean up any remaining hash params as backup
        if (event === 'SIGNED_IN' && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
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

  const value = {
    user,
    profile,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
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
