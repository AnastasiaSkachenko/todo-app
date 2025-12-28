import { session } from "../auth";
import type { Tag, Todo } from "../interfaces";
import {  currentTags, modals, toggleTagForm, toggleTodoForm } from "../main";
import { deleteTodo, filterTodos, toggleDoneTodo } from "./helpersTodo";
import { deleteTag, fetchTags } from "./helpersTags";


export const showPage = (pageId: string) => {
	const account = document.getElementById("account") as HTMLElement;

  // Collect all screen elements
  const screens = [
		account,
		document.getElementById("signUp"),
		document.getElementById("signIn"),
		document.getElementById("updateUser"),
		document.getElementById("resetPasswordForm"),
		document.getElementById("calendar")
  ].filter(Boolean) as HTMLElement[]; // filter out nulls

  // Hide all screens
  screens.forEach(screen => {
	screen.style.display = "none";
  });

  // Show the requested page
  const target = document.getElementById(pageId);
  if (target) {
	target.style.display = "block";
  } else {
	console.warn(`No page found with id: ${pageId}`);
  }
};

const parseDateTimeLocal = (dateTimeStr: string): string => {
	const dateTime = new Date(dateTimeStr).toISOString();
	const date = dateTime.split("T")[0];
	const time = dateTime.split("T")[1].slice(0, 5);
	return `${date} ${time}`;
}


export const updateUI = async (todos?: Todo[]) => {  
	if (!session?.user) {
		showPage("signIn")
		return 
	} 

	let todosDisplay = todos ?? (await  filterTodos("all") ?? [])

	renderTodos(todosDisplay instanceof Array ? todosDisplay : []);
	renderTags()

	const greeting = document.getElementById("greeting") as HTMLParagraphElement;
	greeting.innerText = `Welcome back, ${session.user.user_metadata.name}!`
	showPage('account')
}

export const renderTodos = async (todos: Todo[]) => {
	const tagsResponse = await fetchTags();
	const tags = "error" in tagsResponse ? [] : tagsResponse;

	if (todos?.length === 0) {
		document.getElementById("message")!.innerText = "No todos match your filter criteria.";
	} else {
		document.getElementById("message")!.innerText = "";
	}

	const todoListElement = document.getElementById("todoList") as HTMLUListElement;
	todoListElement.innerHTML = "";

	todos?.forEach((todo: Todo) => {
		todoListElement.innerHTML += `
			<li>
				<div>
					<div class="todo-header">
						<h3>
							${todo.name}
						</h3>
						<button class="toggleDoneBtn" data-id="${todo.id}" data-done="${todo.done}"> ${todo.done ? "✅" : "❌"}</button>
					</div>

					${todo.description ? `<p>${todo.description}</p>` : ""}
					${(todo.tags && (todo.tags.length > 0)) ? "<div class='todoTagsList'>" + todo.tags.map(tag => tagHTML(tag, false)).join("") +  "</div>"  : ""}
					<p>Deadline: ${parseDateTimeLocal(todo.deadline)}</p>
				</div>
				<div class="btn-end">
					<button class="editBtn btn" data-id="${todo.id}">Edit</button>
					<button class="deleteBtn btn" data-id="${todo.id}">Delete</button>
				</div>
				<hr/>
			</li>
		`
	})

	const editTodoButtons = document.getElementsByClassName("editBtn") as HTMLCollectionOf<HTMLButtonElement>;
	for (const btn of editTodoButtons) {
		btn.addEventListener("click", () => {
			document.querySelectorAll<HTMLParagraphElement>(".error").forEach(el => el.textContent = "");
			toggleTodoForm(btn);
			modals.get("todo")?.open()
		});
	}

	const deleteTodoButtons = document.getElementsByClassName("deleteBtn") as HTMLCollectionOf<HTMLButtonElement>;
	for (const btn of deleteTodoButtons) {
		btn.addEventListener("click", async (event) => {
			const result = await deleteTodo(event, btn.dataset.id ?? "");
			if ("error" in result) {
				showError(document, result.error ?? "");
			} else {
				updateUI();
			}
		});
	}

	const toggleDoneButtons = document.getElementsByClassName("toggleDoneBtn") as HTMLCollectionOf<HTMLButtonElement>;
	for (const btn of toggleDoneButtons) {
		btn.addEventListener("click", async (event) => {
			const id = btn.dataset.id!;
			const done = btn.dataset.done === "true";
			const result = await toggleDoneTodo(event, id, done);
			if (result && "error" in result) {
				showError(document, result.error);
			} else {
				updateUI();
			}
		});
	}
	toggleTag(tags)

}

export const tagHTML = (tag:Tag, inHeader: boolean) => {
	return inHeader 
	?  `
		<li class="tag-el">			
			<input data-id=${tag.id} id=${`filterByTag-${tag.id}`} type="checkbox"  class="filterByTag tag-input"  ${currentTags.find(ctag => ctag.id == tag.id) ? "checked" : ""} />
			<label class="tag-label popup-anchor" for=${`filterByTag-${tag.id}`}>${tag.name}</label>
			<p class="tag-description">${tag.description ?? ""}</p>
	
			<button class="editTagBtn" data-id=${tag.id}><i class="fa-solid fa-pen"></i></button>
			<button class="deleteTagBtn" data-id=${tag.id}><i class="fa-solid fa-trash"></i></button>
		</li>
	`
	: `
		<div class="tag-el in-todo">
			<input data-id=${tag.id} type="checkbox"  class="filterByTag tag-input"  ${currentTags.find(ctag => ctag.id == tag.id) ? "checked" : ""} />
			<label class="tag-label" for=${`filterByTag-${tag.id}`}>${tag.name}</label>
		</div>
	`
}



export const renderTags = async () => {
	const tagsResponse = await fetchTags();
	
	if ("error" in tagsResponse) {
		showError(document, tagsResponse.error);
		return;
	}

	const tags = tagsResponse;
	const tagsElement = document.getElementById("tagsList") as HTMLUListElement;
	tagsElement.innerHTML = "";
	tags.forEach((tag) => {
		tagsElement.innerHTML += tagHTML(tag, true);
	})

	const editTagButtons = document.getElementsByClassName("editTagBtn") as HTMLCollectionOf<HTMLButtonElement>;
	for (const btn of editTagButtons) {
		btn.addEventListener("click", () => {
			document.querySelectorAll<HTMLParagraphElement>(".error").forEach(el => el.textContent = "");
			modals.get("tag")?.open()
			toggleTagForm(btn)
		});
	}

	const deleteTagButtons = document.getElementsByClassName("deleteTagBtn") as HTMLCollectionOf<HTMLButtonElement>;
	for (const btn of deleteTagButtons) {
		btn.addEventListener("click", async (event) => {
			const result = await deleteTag(event, btn.dataset.id ?? "");
			if ("error" in result) {
				showError(document, result.error ?? "");
			} else {
				updateUI();
			}
		});
	}

	toggleTag(tags)
}

const toggleTag = (tags: Tag[]) => {
	const filterByTagInput = document.getElementsByClassName("filterByTag") as HTMLCollectionOf<HTMLInputElement>;
	for (const input of filterByTagInput) {
		input.addEventListener("change", async () => {
			const response = await filterTodos("tag", undefined, input.dataset.id ?? "");
			
			if ("error" in response) {
				showError(document, response.error);
				return;
			}

			if (input.checked){
				renderTodos(response);
				currentTags.push(tags.find(t => t.id == input.dataset.id)!);
			} else {
				const deleteResponse = await filterTodos("tag", undefined, input.dataset.id ?? "", true);
				if ("error" in deleteResponse) {
					showError(document, deleteResponse.error);
					return;
				}
				renderTodos(deleteResponse);
				currentTags.splice(currentTags.findIndex(t => t.id == input.dataset.id), 1);
			};
			updateTags()
		});
	}
}

const updateTags = () => {
	const filterByTagInput = document.getElementsByClassName("filterByTag") as HTMLCollectionOf<HTMLInputElement>;
	for (const input of filterByTagInput) {
		input.checked = currentTags.find(ctag => ctag.id == input.dataset.id) ? true : false
	}
}


export function showError(container: HTMLElement | Document = document, message: string) {
  const errorElement = container.querySelector<HTMLParagraphElement>(".error");
  if (errorElement) {
    errorElement.textContent = message;
  } else {
    console.error("Error element not found:", message);
  }
}