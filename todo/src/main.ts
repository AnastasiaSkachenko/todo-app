import { supabase } from "./utils/supabaseClient";
import { handleSignUp, handleSignOut, handleSignIn, handleUpdateUserForm, handleSaveUser, handleResetPassword, handleSendLink  } from "./utils/helpersUser";
import type { User } from '@supabase/supabase-js';
import { showPage, updateUI } from "./utils/helpers";
import { upsertTodo } from "./utils/helpersTodo";

const signUpBtn = document.getElementById("signUpBtn") as HTMLButtonElement;
const signInBtn = document.getElementById("signInBtn") as HTMLButtonElement;
const signOutBtn = document.getElementById("signOut") as HTMLButtonElement;
const updateUserForm = document.getElementById("updateUserForm") as HTMLButtonElement;
const saveUser = document.getElementById("saveUser") as HTMLButtonElement;
const sendLink = document.getElementById("sendLink") as HTMLButtonElement;
const resetButton = document.getElementById("resetPasswordBtn") as HTMLButtonElement;
const createTodoTrigger = document.getElementById("createTodoTrigger") as HTMLButtonElement;
const upsertTodoButton = document.getElementById("submitBtn") as HTMLButtonElement;

let currentUser: User; 
export let showTodoForm = false;
let currentTodo: string | undefined;


updateUserForm.addEventListener("click", (event) => handleUpdateUserForm(event, currentUser));
saveUser.addEventListener("click", (event) => handleSaveUser(event, saveUser));
sendLink.addEventListener("click", () => handleSendLink(sendLink, currentUser.email ?? ""));
signUpBtn.addEventListener("click", (event) => handleSignUp(event, signUpBtn));
signInBtn.addEventListener("click", (event) => handleSignIn(event, signInBtn))
signOutBtn.addEventListener("click", handleSignOut)
resetButton?.addEventListener("click", async () => await handleResetPassword(resetButton));
createTodoTrigger.addEventListener("click", () => {
  toggleTodoForm("Hide");
});

upsertTodoButton.addEventListener("click", (event) => {
  upsertTodo(event, currentTodo)

  if (event.target instanceof HTMLButtonElement && event.target.id.startsWith("edit-")) {
    toggleTodoForm("Edit", event.target.id.replace("edit-", ""));
  } else {
    toggleTodoForm("Add");
  }

})




const hash = window.location.hash;

// Check if user landed via password reset link
if (hash.includes("access_token") && hash.includes("refresh_token")) {
  console.log("access token and refresh token are in hash")
  setTimeout(() => {}, 5000)
  console.log("Password reset flow triggered via email link");
  showPage("resetPasswordForm")

} else  {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) currentUser = session?.user

    updateUI(session);
  });
}

export const toggleTodoForm = async (innerText: string, todoId?: string ) => {

  const todoForm = document.getElementById("formTodo") as HTMLFormElement;
  const button = todoId ? document.getElementById(`edit-${todoId}`) as HTMLButtonElement : createTodoTrigger;

  showTodoForm = !showTodoForm;
  if (showTodoForm) {
  todoForm.style.display = "block";
  button.innerText = "Hide";
  } else {
  todoForm.style.display = "none";
  button.innerText = innerText || "ADD";
  currentTodo = undefined;
  }
  
  if (!todoId) return;
  currentTodo = todoId;

  console.log("Opening edit for todo ID:", currentTodo);
  const { data, error } = await supabase
  .from("Todos")
  .select("*")
  .eq("id", todoId)
  .single();

  if (error) {
  console.error("Supabase error:", error);
  return;
  }

  const nameInput = document.getElementById("nameTodo")  as HTMLInputElement;
  const descriptionInput = document.getElementById("description")  as HTMLInputElement;
  const deadlineInput = document.getElementById("deadline")  as HTMLInputElement;

  nameInput.value = data.name || "";
  descriptionInput.value = data.description || "";
  deadlineInput.value = data.deadline.slice(0, -6);
}

