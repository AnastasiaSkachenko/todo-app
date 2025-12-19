import { supabase } from "./utils/supabaseClient";
import { handleSignUp, handleSignOut, handleSignIn, handleUpdateUserForm, handleSaveUser, handleResetPassword, handleSendLink  } from "./utils/helpersUser";
import type { User } from '@supabase/supabase-js';
import { renderTodos, showPage, updateUI } from "./utils/helpers";
import { clearTodo, filterTodos, sortTodos, upsertTodo } from "./utils/helpersTodo";
import type { FilterOption, Tag, Todo } from "./interfaces";
import { fetchTags, upsertTag } from "./utils/helpersTags";

const signUpBtn = document.getElementById("signUpBtn") as HTMLButtonElement;
const signInBtn = document.getElementById("signInBtn") as HTMLButtonElement;
const signOutBtn = document.getElementById("signOut") as HTMLButtonElement;
const updateUserForm = document.getElementById("updateUserForm") as HTMLButtonElement;
const saveUser = document.getElementById("saveUser") as HTMLButtonElement;
const sendLink = document.getElementById("sendLink") as HTMLButtonElement;
const resetButton = document.getElementById("resetPasswordBtn") as HTMLButtonElement;
const createTodoTrigger = document.getElementById("createTodoTrigger") as HTMLButtonElement;
const upsertTodoButton = document.getElementById("submitBtn") as HTMLButtonElement;
const clearTodosButton = document.getElementById("clearTodosBtn") as HTMLButtonElement;
const filterTodosSelect = document.getElementById("filterTodos") as HTMLSelectElement;
const sortTodosSelect = document.getElementById("sortTodos") as HTMLSelectElement;
const filterSortDateSelect = document.getElementById("filterSortDate") as HTMLSelectElement;
const tagBtn = document.getElementById("tagBtn") as HTMLButtonElement;
const tagFormTrigger = document.getElementById("addTag") as HTMLButtonElement;
const tagForm = document.getElementById("formTag") as HTMLFormElement;

let currentUser: User; 
export const currentTags: Tag[] = [];
export let showTodoForm = false;
export let showTagForm = false;
let todoList: Todo[];
let currentTodo: string | undefined;
let currentTag: string | undefined;
export let currentTagsForm: Tag[] = []

export const setInitial = async (todos: Todo[]) => {
  console.log("Setting todo list:", todos);
  todoList = todos;
  updateUI(todoList);
}

export const clearFormTags = () => currentTagsForm = [];

setInitial(await filterTodos("all"));



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
  if (event.target instanceof HTMLButtonElement && event.target.classList.contains("editBtn")) {
    toggleTodoForm("Edit", event.target);
  } else {
    toggleTodoForm("Add");
  }
})

clearTodosButton.addEventListener("click", async () => {
  const group = document.getElementById("deleteOptions") as HTMLFieldSetElement;
  group.style.display = "block";
  group.addEventListener("change", async (event) => {
    const target = event.target as HTMLInputElement;
    const targetValue = target.value as "all" | "byDate" | "done";
    clearTodo(targetValue);
    group.style.display = "none";
  })
})

filterTodosSelect.addEventListener("change", async (event) => {
  if ((event.target as HTMLSelectElement).value == "dateCreated" || (event.target as HTMLSelectElement).value == "deadline") {
    filterSortDateSelect.style.display = "block";
    filterSortDateSelect.addEventListener("change", async (e) => {
      renderTodos( 
        await  filterTodos((
        event.target as HTMLSelectElement).value as FilterOption, 
        (e.target as HTMLSelectElement).value ? new Date((e.target as HTMLSelectElement).value) : undefined)
      );

    });
  } else {
    filterSortDateSelect.style.display = "none";
    renderTodos( 
      await filterTodos((
      event.target as HTMLSelectElement).value as FilterOption)
    )
  }
});

sortTodosSelect.addEventListener("change", async (event) => {
  if ((event.target as HTMLSelectElement).value == "default") return;

  const sortValue = (event.target as HTMLSelectElement).value;
  const value = sortValue.startsWith("dateCreated") ?
    "dateCreated" 
    : "deadline";
  renderTodos( await sortTodos(
    todoList,
    value,
    sortValue.startsWith("dateCreated") ?
    sortValue.slice(11) as "Asc"
    : sortValue.slice(8) as "Desc"
    )
  )
});

tagBtn.addEventListener("click", (event) => {
  if (event.target instanceof HTMLButtonElement && event.target.classList.contains("editTagBtn")) {
    toggleTagForm("Edit", event.target);
  } else {
    toggleTagForm("Add");
  }

  if (tagBtn.dataset.action == "edit") {
    upsertTag(event, tagBtn.dataset.id);
  } else {
    upsertTag(event);
  }
}) 

tagFormTrigger.addEventListener("click", () => {
  toggleTagForm("Hide");
});



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

    updateUI(todoList);
  });
}


const currentTodosTags =
  document.getElementById("currentTodosTags") as HTMLDivElement;

currentTodosTags.addEventListener("click", (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  if (!target.classList.contains("buttonTagInForm")) return;
  console.log("target", target)
  console.log("dataset", target.dataset)

  const tagId = target.dataset.tagid;
  if (!tagId) return;

  console.log("tagId", tagId)


  currentTagsForm = currentTagsForm.filter(tag => tag.id != tagId);
  showCurrentTodosTags();
});



const showCurrentTodosTags = () => {
  currentTodosTags.innerHTML = "";

  currentTagsForm.forEach(tag => {
    currentTodosTags.innerHTML += `
      <button
        type="button"
        class="buttonTagInForm"
        data-tagId="${tag.id}"
      >
        ${tag.name}
      </button>
    `;
  });
};


export const toggleTodoForm = async (innerText: string, editButton?: HTMLButtonElement ) => {

  const todoForm = document.getElementById("formTodo") as HTMLFormElement;
  const selectTags = document.getElementById("todoTag") as HTMLSelectElement;

  const button = editButton ?? createTodoTrigger;
  const tagsFetched = await fetchTags()
  selectTags.innerHTML = `<option value="-">Select a tag</option>`

  tagsFetched.map((tag) => {
    const option = document.createElement("option")
    option.value = tag.id;
    option.text = tag.name;

    selectTags.appendChild(option)
  })

  selectTags.addEventListener("change", async (event) => {
    if ((event.target as HTMLSelectElement).value == "-") return;

    const selectedTagId = (event.target as HTMLSelectElement).value;
    const tag = tagsFetched.find(t => t.id == selectedTagId);
    if (!tag) return;

    // check if tag already exists in current form
    const exists = currentTagsForm.some(t => t.id == tag.id);
    console.log("tag", tag)
    console.log(exists, "exists")

    if (!exists) {
      console.log("Adding tag:", tag.name);
      currentTagsForm.push(tag);
    } else {
      console.log("Tag already exists, skipping:", tag.name);
    }   
    
    (event.target as HTMLSelectElement).value = "-"
    showCurrentTodosTags()
  });



  showTodoForm = !showTodoForm;
  if (showTodoForm) {
  todoForm.style.display = "block";
  button.innerText = "Hide";
  } else {
  todoForm.style.display = "none";
  button.innerText = innerText || "ADD";
  currentTodo = undefined;
  }


  
  if (!editButton) return;
  currentTodo = editButton.dataset.id;


  console.log("Opening edit for todo ID:", currentTodo);
  const { data, error } = await supabase
    .from("Todos")
    .select(`
      id,
      name,
      description,
      deadline,
      todo_tag (
        Tags (*)
      )
    `)
    .eq("id", currentTodo)
    .single<any>();

  const parsedTodo:Todo = {
    ...data,
    tags: data.todo_tag.map((todoTag:any) => todoTag.Tags)
  }


  if (error) {
  console.error("Supabase error:", error);
  return;
  }

  console.log('parsedTodo', parsedTodo)

  const nameInput = document.getElementById("nameTodo")  as HTMLInputElement;
  const descriptionInput = document.getElementById("description")  as HTMLInputElement;
  const deadlineInput = document.getElementById("deadline")  as HTMLInputElement;



  nameInput.value = data.name || "";
  descriptionInput.value = data.description || "";
  deadlineInput.value = data.deadline.slice(0, -6);
  currentTagsForm = parsedTodo.tags || []

  showCurrentTodosTags()

  console.log("currentTagsForm", currentTagsForm)

}


export const toggleTagForm = async (innerText: string, editButton?: HTMLButtonElement ) => {
  const button = editButton ?? tagFormTrigger;

  showTagForm = !showTagForm;
  console.log("showTagForm after toggle:", showTagForm);

  if (showTagForm) {
  tagForm.style.display = "block";
  button.innerText = "Hide";
  } else {
  tagForm.style.display = "none";
  button.innerText = innerText || "ADD";
  currentTag = undefined;
  }
  
  if (!editButton) return;
  currentTag = editButton.dataset.id;
  tagBtn.dataset.action = "edit";
  tagBtn.dataset.id = currentTag;

  console.log("Opening edit for tag ID:", currentTag);
  const { data, error } = await supabase
  .from("Tags")
  .select("*")
  .eq("id", currentTag)
  .single();

  if (error) {
  console.error("Supabase error:", error);
  return;
  }

  const nameInput = document.getElementById("nameTag")  as HTMLInputElement;
  const descriptionInput = document.getElementById("descriptionTag")  as HTMLInputElement;
  const colorInput = document.getElementById("color")  as HTMLInputElement;

  nameInput.value = data.name || "";
  descriptionInput.value = data.description || "";
  colorInput.value = data.color;
}


