import { supabase } from "./utils/supabaseClient";
import { handleSignUp, handleSignOut, handleSignIn, handleUpdateUserForm, handleSaveUser, handleResetPassword, handleSendLink  } from "./utils/helpersUser";
import type { User } from '@supabase/supabase-js';
import {  renderTodos, showPage, tagHTML, updateUI } from "./utils/helpers";
import { clearTodo, filterTodos, sortTodos, upsertTodo } from "./utils/helpersTodo";
import type { FilterOption, Tag, Todo } from "./interfaces";
import { fetchTags, upsertTag } from "./utils/helpersTags";
import { generateCalendar, populateSelectors } from "./utils/calendar";
import { session } from "./auth";

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
const openCalendarBtn = document.getElementById("openCalendar") as HTMLButtonElement;
const goBackBtn = document.getElementById('goBack') as HTMLButtonElement;
const cancelBtns = document.getElementsByClassName("cancel") as HTMLCollectionOf<HTMLButtonElement>;

let currentUser: User; 
export const currentTags: Tag[] = [];
let todoList: Todo[];
let currentTodo: string | undefined;
let currentTag: string | undefined;
export let currentTagsForm: Tag[] = []

export const setInitial = async () => {
  todoList = await filterTodos("all");
  console.log("Setting todo list:", todoList);

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
createTodoTrigger.addEventListener("click", () => {
    
  modals.get("todo")?.open()

  toggleTodoForm();

});

upsertTodoButton.addEventListener("click", (event) => {
  modals.get("todo")?.close()
  upsertTodo(event, currentTodo)
  if (event.target instanceof HTMLButtonElement && event.target.classList.contains("editBtn")) {
    modals.get("todo")?.open()
    toggleTodoForm(event.target);
  } else {
    toggleTodoForm();
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

openCalendarBtn.addEventListener("click", () => {
  showPage("calendar");
  populateSelectors()
  generateCalendar(new Date().getFullYear(), new Date().getMonth() + 1)
  goBackBtn.addEventListener("click", () => showPage("account"))
})


tagBtn.addEventListener("click", (event) => {
  if (event.target instanceof HTMLButtonElement && event.target.classList.contains("editTagBtn")) {
    toggleTagForm(event.target);
  } else {
    toggleTagForm();
  }

  if (tagBtn.dataset.action == "edit") {
    upsertTag(event, tagBtn.dataset.id);
  } else {
    upsertTag(event);
  }
}) 

tagFormTrigger.addEventListener("click", () => {
  modals.get("tag")?.open();
  toggleTagForm();
});




for (const btn of cancelBtns) {
  btn.addEventListener("click", (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const form = button.closest("form") as HTMLFormElement | null;

    if (form) {
      updateUI()
    }
  });
}




const hash = window.location.hash;

// Check if user landed via password reset link
if (hash.includes("access_token") && hash.includes("refresh_token")) {
  console.log("access token and refresh token are in hash")
  setTimeout(() => {}, 5000)
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



const showCurrentTodosTags =  () => {
  currentTodosTags.innerHTML = "";

  currentTagsForm.forEach(tag => {
    currentTodosTags.innerHTML += tagHTML(tag,false);
  });
};


export const toggleTodoForm = async ( editButton?: HTMLButtonElement ) => {

  const selectTags = document.getElementById("todoTag") as HTMLSelectElement;



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

    if (!exists) {
      console.log("Adding tag:", tag.name);
      currentTagsForm.push(tag);
    } else {
      console.log("Tag already exists, skipping:", tag.name);
    }   
    
    (event.target as HTMLSelectElement).value = "-"
    showCurrentTodosTags()
  });





  
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


export const toggleTagForm = async ( editButton?: HTMLButtonElement ) => {
  
  if (!editButton) return;
  currentTag = editButton.dataset.id;
  tagBtn.dataset.action = "edit";
  tagBtn.dataset.id = currentTag;

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

class Modal {
  private overlay: HTMLElement;
  private modal: HTMLElement;
  private lastFocused: HTMLElement | null = null;

  constructor(overlay: HTMLElement) {
    this.overlay = overlay;
    this.modal = overlay.querySelector(".modal") as HTMLElement;

    this.handleKeydown = this.handleKeydown.bind(this);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close();
    });

    overlay.querySelectorAll("[data-close]").forEach(btn =>
      btn.addEventListener("click", () => this.close())
    );
  }

  open() {
    this.lastFocused = document.activeElement as HTMLElement;
    this.overlay.classList.remove("hidden");

    const focusable = this.getFocusable();
    focusable[0]?.focus();

    document.addEventListener("keydown", this.handleKeydown);
    document.body.style.overflow = "hidden";
  }

  close() {
    this.overlay.classList.add("hidden");
    document.removeEventListener("keydown", this.handleKeydown);
    document.body.style.overflow = "";
    this.lastFocused?.focus();
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") this.close();
    if (e.key === "Tab") this.trapFocus(e);
  }

  private getFocusable(): HTMLElement[] {
    return Array.from(
      this.modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  private trapFocus(e: KeyboardEvent) {
    const focusable = this.getFocusable();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}



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
