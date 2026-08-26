import React, { createContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

export const AuthContext = createContext({
  session: null,
  user: null,
  profile: null,
  loading: true,
  authError: null,
  clearError: () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Store user and profile in refs to prevent recreating the onAuthStateChange subscription
  const userRef = useRef(null);
  const profileRef = useRef(null);

  // Keep refs synchronized with state changes
  useEffect(() => {
    userRef.current = user;
    profileRef.current = profile;
  }, [user, profile]);

  const verifyAndLoadProfile = async (currentSession, forceLoading = false) => {
    if (!currentSession?.user) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const email = currentSession.user.email ? currentSession.user.email.trim().toLowerCase() : '';
    const userId = currentSession.user.id;

    // Check refs to see if the user profile is already cached
    const currentUser = userRef.current;
    const currentProfile = profileRef.current;

    if (currentUser?.id === userId && currentProfile && !forceLoading) {
      setSession(currentSession);
      setUser(currentSession.user);
      return;
    }

    if (forceLoading) {
      setLoading(true);
    }

    try {
      // 1. Try atomic RPC sync which links employee to public.users and resolves roles safely
      let userData = null;
      let empData = null;

      const { data: rpcData, error: rpcError } = await supabase.rpc('sync_user_profile');

      if (!rpcError && rpcData) {
        userData = rpcData;
      } else {
        if (rpcError) {
          console.warn('sync_user_profile RPC failed or not deployed, falling back to direct queries:', rpcError.message);
        }

        // Direct query fallback with case-insensitive matching
        const [userRes, empRes] = await Promise.all([
          supabase.from('users').select('*').ilike('email', email).maybeSingle(),
          supabase.from('employees').select('*').ilike('email', email).maybeSingle(),
        ]);

        if (userRes.error) console.error('Error fetching user profile:', userRes.error);
        if (empRes.error) console.error('Error fetching employee record:', empRes.error);

        userData = userRes.data;
        empData = empRes.data;
      }

      if (!userData && !empData) {
        setAuthError('Access Denied. Your email is not registered in the system.');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
      } else {
        const isActive = (empData ? empData.active : true) && (userData ? userData.active : true);
        if (!isActive) {
          setAuthError('Access Denied. Your account is inactive. Please contact the administrator.');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
        } else {
          const mergedProfile = {
            id: userData?.id || empData?.employee_id || userId,
            email: (userData?.email || empData?.email || email).toLowerCase(),
            role: empData?.role || userData?.role || 'STAFF',
            departments: empData?.departments || userData?.departments || [],
            name: empData?.name || userData?.name || currentSession.user.user_metadata?.full_name || 'User',
            active: isActive,
          };
          setAuthError(null);
          setSession(currentSession);
          setUser(currentSession.user);
          setProfile(mergedProfile);
        }
      }
    } catch (err) {
      console.error('Error during user verification:', err);
      setAuthError('An error occurred during account verification.');
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        verifyAndLoadProfile(initialSession, true);
      } else {
        setLoading(false);
      }
    });

    // Listen to changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_IN' && currentSession) {
        const currentUser = userRef.current;
        const isNewUser = !currentUser || currentUser.id !== currentSession.user.id;
        await verifyAndLoadProfile(currentSession, isNewUser);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Run subscription exactly once on mount to eliminate infinite loop flickering

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setAuthError(null);
    setLoading(false);
  };

  const clearError = () => {
    setAuthError(null);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    authError,
    clearError,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export default AuthProvider;
