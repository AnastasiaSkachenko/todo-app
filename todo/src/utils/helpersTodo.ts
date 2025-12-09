import { session } from "../auth";
import type { Todo } from "../interfaces"
import { updateUI } from "./helpers";
import { supabase } from "./supabaseClient";

const today = new Date().toISOString().split("T")[0];

export const getTodayTodos = async () => {
    const { data, error } = await supabase
    .from("Todos")
    .select("*")
    .gte("deadline", `${today}T00:00:00.000Z`)
    .lte("deadline", `${today}T23:59:59.999Z`);
    if (error) {
    console.error("Supabase error:", error);
    return [];
    }

    console.log("todos:", data);
    return data as Todo[];

}


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

      
    updateUI(session);

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

	updateUI(session);
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
    updateUI(session);

  } catch (error) {
    console.error("Supabase error:", error);
    return null;
  }
};

