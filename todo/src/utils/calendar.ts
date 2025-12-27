import type { Todo } from "../interfaces";
import { filterTodos } from "./helpersTodo";

const calendarContainer  = document.getElementById("calendarContainer") as HTMLDivElement;

const yearSelect = document.getElementById("year") as HTMLSelectElement;
const monthSelect = document.getElementById("month") as HTMLSelectElement;


export const populateSelectors = () => {
    // Populate year select (e.g., from 2020 to 2030)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
        const option = document.createElement("option");
        option.value = y.toString();      // numeric year
        option.textContent = y.toString(); // display year
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear.toString();

    // Populate month select with names
    const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
    ];

    monthSelect.innerHTML = ""
    monthNames.forEach((name, index) => {
        const option = document.createElement("option");
        option.value = (index + 1).toString(); // month number (1-12)
        option.textContent = name; // display name
        monthSelect.appendChild(option);
    });

    // Set current month
    monthSelect.value = (new Date().getMonth() + 1).toString();

    // Example: reading the selected year and month
    yearSelect.addEventListener("change", () => console.log(yearSelect.value));
    monthSelect.addEventListener("change", () => console.log(monthSelect.value));
}

monthSelect.addEventListener("change", () => {
    console.log("trach change of month \n\n\n", monthSelect.value)
    generateCalendar(Number(yearSelect.value), Number(monthSelect.value))
})

yearSelect.addEventListener("change", () => {
    generateCalendar(Number(yearSelect.value), Number(monthSelect.value))
})

export async function generateCalendar(year: number, month: number) {
  calendarContainer.innerHTML = "";

  // JS months are 0-indexed
  const jsMonth = month - 1;

  const lastDay = new Date(year, jsMonth + 1, 0); // last day of month
  const totalDays = lastDay.getDate();

  for (let day = 1; day <= totalDays; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    dayDiv.dataset.day = day.toString(); // <--- important

    const dateHeader = document.createElement("div");
    dateHeader.textContent = day.toString();
    dayDiv.appendChild(dateHeader);

    const todosContainer = document.createElement("div");
    todosContainer.className = "todos-container";
    dayDiv.appendChild(todosContainer);

    calendarContainer.appendChild(dayDiv);
  }

  renderTodos(await filterTodos("month", undefined, undefined, undefined, month, year));
}



export function renderTodos(todos: Todo[]) {
  const days = document.querySelectorAll(".day");
  days.forEach(dayDiv => {
    const todosContainer = dayDiv.querySelector(".todos-container")!;
    todosContainer.innerHTML = "";
  });

  todos.forEach(todo => {
    // parse date parts manually to avoid timezone issues
    const dayStr = todo.deadline.split("T")[0].split("-")[2];
    const todoDay = Number(dayStr);

    // Find the correct day div
    const dayDiv = document.querySelector(`.day[data-day="${todoDay}"]`);
    if (!dayDiv) return;

    const todosContainer = dayDiv.querySelector(".todos-container")!;
    const todoDiv = document.createElement("div");
    todoDiv.className = "todo";
    todoDiv.textContent = todo.name;

    const popup = document.createElement("div");
    popup.className = "description-popup";

    const p = document.createElement("p");
    p.textContent = (todo.description && todo.description?.length > 0) ? todo.description ?? "" : "No description";

    const tags = document.createElement("div");
    if (todo.tags) {
      todo.tags.forEach(tag => {
        const tagBtn = document.createElement("button");
        tagBtn.textContent = tag.name;
        tagBtn.style.color = tag.color;
        tagBtn.style.backgroundColor = "white"
        tags.appendChild(tagBtn);
      });
    }

    popup.appendChild(p);
    popup.appendChild(tags);
    todoDiv.appendChild(popup);

    todosContainer.appendChild(todoDiv);
  });
}
