import { session } from "../auth";
import type { FilterOption, SortOption, Todo } from "../interfaces"
import { clearFormTags, currentTagsForm } from "../main";
import { updateUI } from "./helpers";
import { supabase } from "./supabaseClient";

const tagFilters: string[] = []


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
	const doneButtons = document.getElementsByClassName("toggleDoneBtn") as HTMLCollectionOf<HTMLButtonElement>;
	const done = todoId ? Array.from(doneButtons).find(btn => btn.dataset.id === todoId)?.dataset.done == "true" : false;

  // Basic validation (optional but very helpful!)
  if (!name || !deadline) {
    return {error:"Missing required fields: name or deadline."};
  }

  // Build row cleanly
  const todo = {
    id: todoId || undefined,
    name,
    description,
    deadline,
    user: session?.user.id,
    done,
  };

	try {
		// 1. Upsert todo
		const { data: currentTodo, error } = await supabase
			.from("Todos")
			.upsert(todo)
			.select()
			.single<Todo>();

		if (error) return {error: error.message};

		// 2. Extract tag IDs
		const tagIds = currentTagsForm.map(tag => tag.id);

		// 3. Upsert relations
		if (tagIds.length > 0) {
			const relations = tagIds.map(tagId => ({
				todo_id: currentTodo.id,
				tag_id: tagId
			}));

			const { error: upsertError } = await supabase
				.from("todo_tag")
				.upsert(relations, {
					onConflict: "todo_id,tag_id"
				});

			if (upsertError) return {error: upsertError.message};
		}

		// 4. Delete removed relations
		const { error: deleteError } = await supabase
			.from("todo_tag")
			.delete()
			.eq("todo_id", currentTodo.id)
			.not(
				"tag_id",
				"in",
				tagIds.length
					? `(${tagIds.map(id => `"${id}"`).join(",")})`
					: "()"
			);

		if (deleteError) return {error: deleteError.message};

		// 5. Reset UI
		nameInput.value = "";
		descriptionInput.value = "";
		deadlineInput.value = "";
		clearFormTags();

		updateUI();
		return currentTodo;

	} catch (error) {
		return {error: "Error while saving todo"};
	}
};

export const toggleDoneTodo = async (event: PointerEvent, todoId: string, done: boolean) => {
	event.preventDefault();		
	try {
		const { error } = await supabase
			.from("Todos")
			.update({ done: !done })
			.eq("id", todoId);
			
		if (error) return {error: error.message};
		updateUI();

	} catch (error) {
		return {error: "Error while updating todo"};
	}
}

export const deleteTodo = async (event: PointerEvent, todoId: string) => {
  event.preventDefault();

  try {
    const { error } = await supabase
      .from("Todos")
      .delete()
			.eq("id", todoId);
    if (error) return {error: error.message};

    updateUI();
    return { success: true };

  } catch (error) {
    return {error: "Error while deleting todo"};
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

		if (error) return {error: error.message};

		updateUI();

	} catch (error) {
        return {error: "Error while clearing Todo"};
	}
};

export const filterTodos = async (filter: FilterOption, date?: Date, tag?: string, deleteTag?: boolean, month?: number, year?: number) => {
	const nextMonth = month && month < 12 ? month + 1 : 1;
	const nextYear = year && month == 12 ? year + 1 : undefined;

	let query = supabase
	.from("Todos")
	.select(`
		*,
		todo_tag (
			tag:Tags (*)
		)
	`)
	.eq("user", session?.user.id);

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
	} else if (filter === "tag" && tag) {
		if (deleteTag) { 
			const index = tagFilters.indexOf(tag);
			if (index > -1) {
				tagFilters.splice(index, 1);
			}
		} else {
			if (!tagFilters.includes(tag)) {
				tagFilters.push(tag);
			}
		}
		// 1. Find all todo_ids with this tag
		if (tagFilters.length > 0) {
			const { data: links, error } = await supabase
				.from("todo_tag")
				.select("todo_id, tag_id")
				.in("tag_id", tagFilters);
	

			if (error) {
				return {error: "Error filtering todos"}
			}

			// Count how many filtered tags each todo has
			const tagCountByTodo: Record<string, number> = {};
			for (const link of links) {
				tagCountByTodo[link.todo_id] =
				(tagCountByTodo[link.todo_id] || 0) + 1;
			}

			// Keep todos that match ALL tags
			const todoIds = Object.entries(tagCountByTodo)
				.filter(([, count]) => count === tagFilters.length)
				.map(([todoId]) => todoId);

			if (todoIds.length === 0) return [];

			query = query.in("id", todoIds);
		}
		
	} else if (filter === "month") {
		if (month || year) {
			query = query.gte("deadline", `${year}-${month}-1T00:00:00.000Z`)
			.lte("deadline", `${nextYear ?? year}-${nextMonth}-1T00:00:00.000Z`)
		}
	}

	const { data, error } = await query;


	if (error) {
        return {error: error.message};
	}

	const todosWithTags: Todo[] = (data ?? []).map((todo: any) => ({
	...todo,
	tags: todo.todo_tag?.map((tt: any) => tt.tag) ?? []
	}));

	return todosWithTags;
}


export const sortTodos = async (todos: Todo[], sort: SortOption, order: "Asc" | "Desc") => {
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
	return todos as Todo[];
}