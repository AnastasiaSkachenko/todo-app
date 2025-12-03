import { supabase } from "./utils/supabaseClient";
import { signOut } from "./auth";
import { handleRegister, showPage } from "./helpers";

const errorP = document.getElementById("error") as HTMLParagraphElement;
const button = document.getElementById("registerBtn") as HTMLButtonElement;
const buttonSignOut = document.getElementById("signOut") as HTMLButtonElement;

// sign up logic


const updateUIBasedOnSession = (session: any) => {
  console.log("session", session)
  if (session?.user) {
    showPage('app')
    const greeting = document.getElementById("greeting") as HTMLParagraphElement 
    greeting.innerText = `Welcome back, ${session.user.user_metadata.name}`
  } else {
    showPage("register")
  } 
};




supabase.auth.getSession().then(({ data, error }) => {
  console.log("data", data)
  if (error) console.log("error", error)
  updateUIBasedOnSession(data.session);
});

button?.addEventListener("click", (event) => handleRegister(event, errorP, button));

supabase.auth.onAuthStateChange((_event, session) => {
  console.log("Auth event:", _event, session);
  updateUIBasedOnSession(session);
});


buttonSignOut.addEventListener("click", signOut)

