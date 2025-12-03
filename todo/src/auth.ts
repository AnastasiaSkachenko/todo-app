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

// Sign in
export const signIn = async (email: string, password: string) => {
  const {data:existing, error:errorFindUser} = await supabase.from("Users").select("*").eq("email", email).maybeSingle()

  if (errorFindUser) throw errorFindUser;

  if (existing) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return {data};

  } else {
    return {error: "User with this does not exists. Check if your email adress was spelled correctly."}

  }
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};


export const { data: { session } } = await supabase.auth.getSession();
