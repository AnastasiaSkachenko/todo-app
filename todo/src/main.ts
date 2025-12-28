import { supabase } from "./utils/supabaseClient";
import { handleSignUp, handleSignOut, handleSignIn, handleUpdateUserForm, handleSaveUser, handleResetPassword, handleSendLink  } from "./utils/helpersUser";
import type { User } from '@supabase/supabase-js';
import {  renderTodos, showError, showPage, tagHTML, updateUI } from "./utils/helpers";
import { clearTodo, filterTodos, sortTodos, upsertTodo } from "./utils/helpersTodo";
import type { FilterOption, Tag, Todo } from "./interfaces";
import { fetchTags, upsertTag } from "./utils/helpersTags";
import { generateCalendar, populateSelectors } from "./utils/calendar";
import { session } from "./auth";
import { Modal } from "./utils/modal";

const signUpBtn = document.getElementById("signUpBtn") as HTMLButtonElement;
const signInBtn = document.getElementById("signInBtn") as HTMLButtonElement;
const signOutBtn = document.getElementById("signOut") as HTMLButtonElement;
const updateUserForm = document.getElementById("updateUserForm") as HTMLButtonElement;
const saveUser = document.getElementById("saveUser") as HTMLButtonElement;
const sendLink = document.getElementById("sendLink") as HTMLButtonElement;
const resetButton = document.getElementById("resetPasswordBtn") as HTMLButtonElement;

const createTodo = document.getElementById("createTodo") as HTMLButtonElement;
const upsertTodoButton = document.getElementById("submitBtn") as HTMLButtonElement;
const clearTodosButton = document.getElementById("clearTodosBtn") as HTMLButtonElement;
const filterTodosSelect = document.getElementById("filterTodos") as HTMLSelectElement;
const sortTodosSelect = document.getElementById("sortTodos") as HTMLSelectElement;
const filterSortDateSelect = document.getElementById("filterSortDate") as HTMLSelectElement;
const tagBtn = document.getElementById("tagBtn") as HTMLButtonElement;
const openTagForm = document.getElementById("openTagForm") as HTMLButtonElement;
const openCalendarBtn = document.getElementById("openCalendar") as HTMLButtonElement;
const goBackBtn = document.getElementById('goBack') as HTMLButtonElement;
const cancelBtns = document.getElementsByClassName("cancel") as HTMLCollectionOf<HTMLButtonElement>; // used for user forms only

let currentUser: User; 
export const currentTags: Tag[] = [];
let todoList: Todo[];
let currentTodo: string | undefined;
let currentTag: string | undefined;
export let currentTagsForm: Tag[] = [] //list of currently chosen tags inside todo form


const handleFilterTodos = async (...param: Parameters<typeof filterTodos>): Promise<Todo[] | void> => {
  const response = await filterTodos(...param);

  if ("error" in response) {
    const errorElement = document.querySelector<HTMLParagraphElement>(".error");
    if (errorElement) {
      errorElement.textContent = response.error;
    }
    return; // explicitly returning void
  } else {
    return response; // TypeScript now knows this is Todo[]
  }
};

const handleGetTags = async (...param: Parameters<typeof fetchTags>): Promise<Tag[] | void> => {
  const response = await fetchTags(...param);

  if ("error" in response) {
    const errorElement = document.querySelector<HTMLParagraphElement>(".error");
    if (errorElement) {
      errorElement.textContent = response.error;
    }
    return; // explicitly returning void
  } else {
    return response; // TypeScript now knows this is Todo[]
  }
};

export const setInitial = async () => {
  todoList = await  handleFilterTodos("all") ?? [];
  updateUI(todoList);
}

export const clearFormTags = () => currentTagsForm = [];

session?.user && setInitial();


updateUserForm.addEventListener("click", (event) => handleUpdateUserForm(event, currentUser));
saveUser.addEventListener("click", (event) => handleSaveUser(event, saveUser));
sendLink.addEventListener("click", () => handleSendLink(sendLink, currentUser.email ?? ""));
signUpBtn.addEventListener("click", (event) => handleSignUp(event, signUpBtn));
signInBtn.addEventListener("click", (event) => handleSignIn(event))
signOutBtn.addEventListener("click", handleSignOut)
resetButton?.addEventListener("click", async () => await handleResetPassword(resetButton));
createTodo.addEventListener("click", () => {
  document.querySelectorAll<HTMLParagraphElement>(".error").forEach(el => el.textContent = "");
  modals.get("todo")?.open()
  toggleTodoForm();
});

upsertTodoButton.addEventListener("click", async (event) => {
  const result = await upsertTodo(event, currentTodo);

  if ("error" in result) {
    showError(document.getElementById("formTodo")!, result.error);
    return; // Keep modal open
  }

  modals.get("todo")?.close();
  toggleTodoForm();
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
        await  handleFilterTodos((
        event.target as HTMLSelectElement).value as FilterOption, 
        (e.target as HTMLSelectElement).value ? new Date((e.target as HTMLSelectElement).value) : undefined)
        ?? []
      );

    });
  } else {
    filterSortDateSelect.style.display = "none";
    renderTodos( 
      await handleFilterTodos((
      event.target as HTMLSelectElement).value as FilterOption)
      ?? []
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

openCalendarBtn.addEventListener("click", () => {
  showPage("calendar");
  populateSelectors()
  generateCalendar(new Date().getFullYear(), new Date().getMonth() + 1)
  goBackBtn.addEventListener("click", () => showPage("account"))
})


tagBtn.addEventListener("click", async (event) => {
  const result = await upsertTag(event, tagBtn.dataset.id);

  if ("error" in result) {
    showError(document.getElementById("formTag")!, result.error);
    return; // Keep modal open
  }

  // Clear form state for next use
  tagBtn.dataset.action = "";
  tagBtn.dataset.id = "";
  currentTag = undefined;
  
  modals.get("tag")?.close();
  toggleTagForm();
}) 

openTagForm.addEventListener("click", () => {
  document.querySelectorAll<HTMLParagraphElement>(".error").forEach(el => el.textContent = "");
  modals.get("tag")?.open();
  toggleTagForm();
});


for (const btn of cancelBtns) {
  btn.addEventListener("click", (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const form = button.closest("form") as HTMLFormElement | null;

    if (form) {
      form.reset();
      document.querySelectorAll<HTMLParagraphElement>(".error").forEach(el => el.textContent = "");
      updateUI()
    }
  });
}


const hash = window.location.hash;

// Check if user landed via password reset link
if (hash.includes("access_token") && hash.includes("refresh_token")) {
  setTimeout(() => {}, 5000)
  showPage("resetPasswordForm")

} else  {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) currentUser = session?.user

    updateUI(todoList);
  });
}


const currentTodosTags = document.getElementById("currentTodosTags") as HTMLDivElement;

currentTodosTags.addEventListener("click", (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  if (!target.classList.contains("buttonTagInForm")) return;

  const tagId = target.dataset.tagid;
  if (!tagId) return;

  currentTagsForm = currentTagsForm.filter(tag => tag.id != tagId);
  showCurrentTodosTags();
});



const showCurrentTodosTags =  () => {
  currentTodosTags.innerHTML = "";

  currentTagsForm.forEach(tag => {
    currentTodosTags.innerHTML += tagHTML(tag,false);
  });
};


export const toggleTodoForm = async (editButton?: HTMLButtonElement) => {
  try {
    const selectTags = document.getElementById("todoTag") as HTMLSelectElement;
    const tagsFetched = await handleGetTags() ?? [];

    selectTags.innerHTML = `<option value="-">Select a tag</option>`;
    tagsFetched.forEach(tag => {
      const option = document.createElement("option");
      option.value = tag.id;
      option.text = tag.name;
      selectTags.appendChild(option);
    });

    selectTags.addEventListener("change", (event) => {
      const selectedTagId = (event.target as HTMLSelectElement).value;
      if (selectedTagId === "-") return;
      const tag = tagsFetched.find(t => t.id === selectedTagId);
      if (!tag) return;

      if (!currentTagsForm.some(t => t.id === tag.id)) {
        currentTagsForm.push(tag);
      }
      (event.target as HTMLSelectElement).value = "-";
      showCurrentTodosTags();
    });

    if (!editButton) return;

    currentTodo = editButton.dataset.id;

    const { data, error } = await supabase
      .from("Todos")
      .select(`id, name, description, deadline, todo_tag ( Tags (*) )`)
      .eq("id", currentTodo)
      .single<any>();

    if (error) throw new Error(error.message);

    const parsedTodo: Todo = {
      ...data,
      tags: data.todo_tag.map((tt: any) => tt.Tags)
    };

    const nameInput = document.getElementById("nameTodo") as HTMLInputElement;
    const descriptionInput = document.getElementById("description") as HTMLInputElement;
    const deadlineInput = document.getElementById("deadline") as HTMLInputElement;

    nameInput.value = data.name || "";
    descriptionInput.value = data.description || "";
    deadlineInput.value = data.deadline.slice(0, -6);
    currentTagsForm = parsedTodo.tags || [];

    showCurrentTodosTags();

  } catch (err) {
    // Show error inside the modal without closing it
    showError(document.getElementById("formTodo")!, (err as Error).message);
  }
};



export const toggleTagForm = async (editButton?: HTMLButtonElement) => {
  if (!editButton) return;
  currentTag = editButton.dataset.id;
  tagBtn.dataset.action = "edit";
  tagBtn.dataset.id = currentTag;

  try {
    const { data, error } = await supabase
      .from("Tags")
      .select("*")
      .eq("id", currentTag)
      .single();

    if (error) throw new Error(error.message);

    const nameInput = document.getElementById("nameTag") as HTMLInputElement;
    const descriptionInput = document.getElementById("descriptionTag") as HTMLInputElement;
    const colorInput = document.getElementById("color") as HTMLInputElement;

    nameInput.value = data.name || "";
    descriptionInput.value = data.description || "";
    colorInput.value = data.color;

  } catch (err) {
    showError(document.getElementById("formTag")!, (err as Error).message);
  }
};




export const modals = new Map<string, Modal>();

document.querySelectorAll<HTMLElement>("[data-modal]").forEach(overlay => {
  const name = overlay.dataset.modal!;
  modals.set(name, new Modal(overlay));
});

document.querySelectorAll<HTMLElement>("[data-open-modal]").forEach(btn => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.openModal!;
    modals.get(name)?.open();
  });
});
