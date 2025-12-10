import { session } from "../auth";
import type { FilterOption, SortOption, Todo } from "../interfaces"
import { updateUI } from "./helpers";
import { supabase } from "./supabaseClient";


export const upsertTodo = async (event: PointerEvent, todoId?: string) => {
  event.preventDefault();

  // Grab elements once
  const nameInput = document.getElementById("nameTodo") as HTMLInputElement;
  const descriptionInput = document.getElementById("description") as HTMLInputElement;
  const deadlineInput = document.getElementById("deadline") as HTMLInputElement;

  // Extract values
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  const deadline = deadlineInput.value;

  // Basic validation (optional but very helpful!)
  if (!name || !deadline) {
    console.error("Missing required fields: name or deadline.");
    return;
  }


  console.log("id:", todoId);
  // Build row cleanly
  const todo = {
    id: todoId || undefined,
    name,
    description,
    deadline,
    user: session?.user.id,
    done: false
  };

  try {
    const { data, error } = await supabase
      .from("Todos")
      .upsert(todo)
      .select(); // ensures updated row comes back

    if (error) throw error;

    // Clear inputs
    nameInput.value = "";
    descriptionInput.value = "";
    deadlineInput.value = "";

    console.log("Upserted todo:", data);

      
    updateUI();

    return data;

  } catch (error) {
    console.error("Supabase error:", error);
    return null;
  }
};

export const toggleDoneTodo = async (event: PointerEvent, todoId: string, done: boolean) => {
	event.preventDefault();		
	try {
		const { error } = await supabase
			.from("Todos")
			.update({ done: !done })
			.eq("id", todoId);
		if (error) throw error;

	} catch (error) {
		console.error("Supabase error:", error);
		return null;
	}

	updateUI();
}

export const deleteTodo = async (event: PointerEvent, todoId: string) => {
  event.preventDefault();

  try {
    const { error } = await supabase
      .from("Todos")
      .delete()
			.eq("id", todoId);
    if (error) throw error;

    // Clear inputs
    updateUI();

  } catch (error) {
    console.error("Supabase error:", error);
    return null;
  }
};

export const clearTodo = async (type: "byDate" | "all" | "done") => {
	try {
		let query = supabase.from("Todos").delete();

		if (type === "byDate") {
			const today = new Date().toISOString().split("T")[0];
			query = query
				.gte("deadline", `${today}T00:00:00.000Z`)
				.lte("deadline", `${today}T23:59:59.999Z`);
		} else if (type === "done") {
			query = query.eq("done", true);
		} else if (type === "all") {
			query = query.eq("user", session?.user.id); 
		}

		// Execute the query here
		const { error } = await query;

		if (error) throw error;

		updateUI();

	} catch (error) {
		console.error("Supabase error:", error);
		return null;
	}
};

export const filterTodos = async (filter: FilterOption, date?: Date) => {
	let query = supabase.from("Todos").select("*").eq("user", session?.user.id);

	const parsedDate = date ? date.toISOString().split("T")[0] : null;

	if (filter === "dateCreated") {
		query = query.gte("created_at", `${parsedDate}T00:00:00.000Z`)
    .lte("created_at", `${parsedDate}T23:59:59.999Z`);
	} else if (filter === "done") {
		query = query.eq("done", true);
	} else if (filter === "notDone") {
		query = query.eq("done", false);
	} else if (filter === "deadline") {
		query = query.gte("deadline", `${parsedDate}T00:00:00.000Z`)
    .lte("deadline", `${parsedDate}T23:59:59.999Z`);
	}

	const { data, error } = await query;

	if (error) {
		console.error("Supabase error:", error);
		return [];
	}

	return data as Todo[];
}


export const sortTodos = async (todos: Todo[], sort: SortOption, order: "Asc" | "Desc") => {
	console.log(`Sorting todos ${todos} by ${sort} in ${order} order`);
	if (sort === "dateCreated") {
		todos.sort((a, b) => {
			const dateA = new Date(a.created_at).getTime();
			const dateB = new Date(b.created_at).getTime();
			return order === "Asc" ? dateA - dateB : dateB - dateA;
		});
	} else if (sort === "deadline") {
		todos.sort((a, b) => {
			const dateA = new Date(a.deadline).getTime();
			const dateB = new Date(b.deadline).getTime();
			return order === "Desc" ? dateA - dateB : dateB - dateA;
		});
		return todos;
	}

	console.log("Todos returned from sortTodos:", todos);
	return todos as Todo[];
}


