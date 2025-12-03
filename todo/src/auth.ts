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


export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5174/#resetPassword' 
    });


    if (error) return { error: error.message };

    return { data };
  } catch (err) {
    return { error: (err as Error).message };
  }
};

export const savePassword = async (newPassword: string) => {
  const rawHash = window.location.hash.substring(1);

  // Find where the actual token parameters start
  const tokenIndex = rawHash.indexOf("access_token");

  if (tokenIndex === -1) {
    console.error("No access_token found inside hash:", rawHash);
    return;
  }

  // Only keep the token parameters: "access_token=...&refresh_token=..."
  const queryString = rawHash.substring(tokenIndex);

  const params = new URLSearchParams(queryString);

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");


  if (!accessToken || !refreshToken) {
    console.error("Could not extract tokens. Query string:", queryString);
    return;
  }

  // Create a session
  const {  error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  if (sessionError) {
    console.error("Failed to set session:", sessionError.message);
    return;
  }


  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (updateError) {
    console.error("Failed to update password:", updateError.message);
  } else {
    console.log("Password updated successfully!");
  }
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};


export const { data: { session } } = await supabase.auth.getSession();
