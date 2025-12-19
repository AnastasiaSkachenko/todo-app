import { session } from "../auth";
import type { Tag, Todo } from "../interfaces";
import {  currentTags, toggleTagForm, toggleTodoForm } from "../main";
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

	console.log("Updating UI with todos:", todos);

	let todosDisplay = todos ?? await  filterTodos("all")

	renderTodos(todosDisplay);
	renderTags()

	const greeting = document.getElementById("greeting") as HTMLParagraphElement;
	greeting.innerText = `Welcome back, ${session.user.user_metadata.name}!`
	showPage('account')

}

export const renderTodos = async (todos: Todo[]) => {
	const tags = await fetchTags()

	console.log("render todos", todos)
	if (todos?.length === 0) {
		document.getElementById("message")!.innerText = "No todos match your filter criteria.";
	} else {
		document.getElementById("message")!.innerText = "";
	}

	const todoListElement = document.getElementById("todoTodayList") as HTMLUListElement;
	todoListElement.innerHTML = "";

	todos?.forEach((todo: Todo) => {
		todoListElement.innerHTML += `
			<li>
				<div>
					<h3>
						${todo.name}
						<button class="toggleDoneBtn" data-id="${todo.id}"data-done="${todo.done}"> ${todo.done ? "✅" : "❌"}</button>
					</h3>
					${todo.description ? `<p>${todo.description}</p>` : ""}
					${(todo.tags && (todo.tags.length > 0)) ? todo.tags.map(tag => tagHTML(tag, false)).join(", ") : ""}
					<p>Deadline: ${parseDateTimeLocal(todo.deadline)}</p>
				</div>
				<div>
					<button class="editBtn" data-id=${todo.id}>Edit</button>
					<button class="deleteBtn" data-id=${todo.id}>Delete</button>
				</div>
				<hr/>
			</li>
		`
	})

	const editTodoButtons = document.getElementsByClassName("editBtn") as HTMLCollectionOf<HTMLButtonElement>;
	for (const btn of editTodoButtons) {
		btn.addEventListener("click", () => toggleTodoForm("Hide", btn));
	}

	const deleteTodoButtons = document.getElementsByClassName("deleteBtn") as HTMLCollectionOf<HTMLButtonElement>;
	for (const btn of deleteTodoButtons) {
		btn.addEventListener("click", (event) => deleteTodo(event, btn.dataset.id ?? ""));
	}

	const toggleDoneButtons = document.getElementsByClassName("toggleDoneBtn") as HTMLCollectionOf<HTMLButtonElement>;
	for (const btn of toggleDoneButtons) {
		btn.addEventListener("click", (event) => {
			const id = btn.dataset.id!;
			const done = btn.dataset.done === "true";
			toggleDoneTodo(event, id, done);
		});
	}
	toggleTag(tags)

}

export const tagHTML = (tag:Tag, inHeader: boolean) => {
	return inHeader 
	?  `
		<li>
			<label for=${`filterByTag-${tag.id}`}>${tag.name}</label>
			<input data-id=${tag.id} type="checkbox"  class="filterByTag"  ${currentTags.find(ctag => ctag.id == tag.id) ? "checked" : ""} />
			<p>${tag.description ?? ""}</p>
			<button class="editTagBtn" data-id=${tag.id}>Edit</button>
			<button class="deleteTagBtn" data-id=${tag.id}>Delete</button>
		</li>
	`
	: `
		<>
			<label for=${`filterByTag-${tag.id}`}>${tag.name}</label>
			<input data-id=${tag.id} type="checkbox"  class="filterByTag"  ${currentTags.find(ctag => ctag.id == tag.id) ? "checked" : ""} />
		</>
	`
}



export const renderTags = async () => {
	const tags = await fetchTags()

	const tagsElement = document.getElementById("tagsList") as HTMLUListElement;
	tagsElement.innerHTML = "";
	tags.forEach((tag) => {
		tagsElement.innerHTML += tagHTML(tag, true);
	})

	const editTagButtons = document.getElementsByClassName("editTagBtn") as HTMLCollectionOf<HTMLButtonElement>;
	for (const btn of editTagButtons) {
		btn.addEventListener("click", () => toggleTagForm("Hide", btn));
	}

	const deleteTagButtons = document.getElementsByClassName("deleteTagBtn") as HTMLCollectionOf<HTMLButtonElement>;
	for (const btn of deleteTagButtons) {
		btn.addEventListener("click", (event) => deleteTag(event, btn.dataset.id ?? ""));
	}

	toggleTag(tags)
}

const toggleTag = (tags: Tag[]) => {
	const filterByTagInput = document.getElementsByClassName("filterByTag") as HTMLCollectionOf<HTMLInputElement>;
	for (const input of filterByTagInput) {
		input.addEventListener("change", async () => {
			console.log("Tag filter changed:", input.dataset.id, input.checked);
			if (input.checked){
				renderTodos(await filterTodos("tag", undefined ,  input.dataset.id ?? ""));
				currentTags.push(tags.find(t => t.id == input.dataset.id)!);
			} else {
				renderTodos(await filterTodos("tag", undefined ,  input.dataset.id ?? "", true));
				currentTags.splice(currentTags.findIndex(t => t.id == input.dataset.id), 1);
			};
			console.log("current tags", currentTags)
			console.log("input.dataset.id", input.dataset.id)
			console.log("tags fetched", tags)
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

