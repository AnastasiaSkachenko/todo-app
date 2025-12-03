import { supabase } from "./utils/supabaseClient";
import { handleSignUp, handleSignOut, updateUIBasedOnSession, handleSignIn, handleUpdateUserForm, handleSaveUser } from "./helpers";
import type { User } from '@supabase/supabase-js';

const signUpBtn = document.getElementById("signUpBtn") as HTMLButtonElement;
const signInBtn = document.getElementById("signInBtn") as HTMLButtonElement;
const signOutBtn = document.getElementById("signOut") as HTMLButtonElement;
const updateUserForm = document.getElementById("updateUserForm") as HTMLButtonElement;
const saveUser = document.getElementById("saveUser") as HTMLButtonElement;

let currentUser: User 

supabase.auth.getSession().then(({ data, error }) => {
  console.log("data", data)
  if (data.session?.user) currentUser = data.session?.user
  if (error) console.log("error", error)
  updateUIBasedOnSession(data.session);
});

supabase.auth.onAuthStateChange((_event, session) => {
  console.log("Auth event:", _event, session);
  updateUIBasedOnSession(session);
});


updateUserForm.addEventListener("click", (event) => handleUpdateUserForm(event, currentUser));
saveUser.addEventListener("click", (event) => handleSaveUser(event, saveUser));
signUpBtn.addEventListener("click", (event) => handleSignUp(event, signUpBtn));
signInBtn.addEventListener("click", (event) => handleSignIn(event, signInBtn))
signOutBtn.addEventListener("click", handleSignOut)

