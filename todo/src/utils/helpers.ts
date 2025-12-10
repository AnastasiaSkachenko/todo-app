import { session } from "../auth";
import type { Todo } from "../interfaces";
import { toggleTodoForm } from "../main";
import { deleteTodo, filterTodos, toggleDoneTodo } from "./helpersTodo";


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
//should be date in format YYYY-MM-DD but date type is Date


	const greeting = document.getElementById("greeting") as HTMLParagraphElement;
	greeting.innerText = `Welcome back, ${session.user.user_metadata.name}!`

	const todoListElement = document.getElementById("todoTodayList") as HTMLUListElement;
	const todoList = todos ?? await  filterTodos("all")
	todoListElement.innerHTML = "";


	todoList?.forEach((todo: Todo) => {
		todoListElement.innerHTML += `
			<li>
				<div>
					<h3>
						${todo.name}
						<button class="toggleDoneBtn" data-id="${todo.id}"data-done="${todo.done}"> ${todo.done ? "✅" : "❌"}</button>
					</h3>
					${todo.description ? `<p>${todo.description}</p>` : ""}
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
		btn.addEventListener("click", () => toggleTodoForm("Hide", btn.dataset.id));
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
			
	showPage('account')

}

