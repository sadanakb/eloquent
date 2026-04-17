import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase.js';
import { syncFromServer, syncToServer } from '../engine/sync';
import { loadGroqKeyFromSupabase, saveGroqKeyWithSync, getGroqKey } from '../engine/ki-scorer.js';
import eventBus from '../engine/event-bus.js';
import { logger } from '../engine/logger.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        elo_rating: 400,
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
      let p = await fetchOrCreateProfile(session.user.id);
      // Ensure friend_code exists for older profiles
      if (p && !p.friend_code && supabase) {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: updated } = await supabase
          .from('profiles')
          .update({ friend_code: code })
          .eq('id', session.user.id)
          .select()
          .single();
        if (updated) p = updated;
      }
      setProfile(p);
      // Best-effort sync from server after profile is loaded
      syncFromServer(session.user.id).catch(() => {});
      // Sync Groq key: cloud → local, or local → cloud on first login
      syncGroqKey(session.user).catch(() => {});
    } else {
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (!isSupabaseReady()) {
      setIsLoading(false);
      return;
    }

    // Check session immediately on mount (handles OAuth redirect code exchange).
    // Wrap in 10s timeout so a hanging Supabase call never leaves the AuthModal
    // spinner spinning forever. If we time out we proceed as "not logged in";
    // onAuthStateChange can still recover later when the network is back.
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      logger.error('Supabase getSession() timed out after 10s — proceeding as unauthenticated');
      setIsLoading(false);
    }, 10000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        setSession(session);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        logger.error('Session load failed:', err?.message || err);
        setIsLoading(false);
      });

    // Listen to all subsequent auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  async function syncGroqKey(authUser) {
    const keyLoaded = await loadGroqKeyFromSupabase(authUser.id);
    if (keyLoaded) return;
    // No key in cloud — upload local key if it exists
    const localKey = localStorage.getItem('eloquent_groq_key');
    if (localKey) {
      try {
        const raw = atob(localKey);
        if (raw && raw.startsWith('gsk_')) {
          await saveGroqKeyWithSync(raw, authUser);
        }
      } catch { /* invalid base64 */ }
    }
  }

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
    // Best-effort sync to server before signing out
    if (user?.id) {
      await syncToServer(user.id).catch(() => {});
    }
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
      logger.error('Profile update failed:', error.message);
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
