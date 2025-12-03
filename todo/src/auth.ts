import { supabase } from './utils/supabaseClient';


export const signUp = async (email: string, password: string, name: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }   // ← saves name in user_metadata
      }
    });

    console.log("SIGNUP RESULT:", data, error);

    if (data?.user && data.user.identities?.length === 0) {
      return { error: "User with this email already exists. Try logging in instead." };
    }

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (err) {
    return { error: (err as Error).message };
  }
};


export const updateUser = async (updates: { email?: string; name?: string }) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      email: updates.email,
      data: updates.name ? { name: updates.name } : undefined
    });

    if (error) return { error: error.message };
    return { data };
  } catch (err) {
    return { error: (err as Error).message };
  }
};

export const signIn = async (email: string, password: string) => {
  const res = await supabase.auth.signInWithPassword({ email, password });

  if (res.error) {
    // `error` exists only when login failed
    return { error: res.error.message }; 
  }

  // Successful login
  return { data: res.data };
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};


export const { data: { session } } = await supabase.auth.getSession();
