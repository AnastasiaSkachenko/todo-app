import { session } from "../auth";
import type { Tag } from "../interfaces";
import { updateUI } from "./helpers";
import { supabase } from "./supabaseClient";

export const fetchTags = async () => {
    const { data, error } = await supabase
    .from("Tags")
    .select("*")
    .eq("user", session?.user.id);;

    if (error) {
        console.error("Supabase error:", error);
        return [];
    }

    return data as Tag[];
}

export const upsertTag = async (event: PointerEvent, tagId?: string) => {
  event.preventDefault();

  // Grab elements once
  const nameInput = document.getElementById("nameTag") as HTMLInputElement;
  const descriptionInput = document.getElementById("descriptionTag") as HTMLInputElement;
  const colorInput = document.getElementById("color") as HTMLInputElement;

  // Extract values
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  const color = colorInput.value;

  // Basic validation (optional but very helpful!)
  if (!name || !color) {
    console.error("Missing required fields: name or color.");
    return;
  }


  // Build row cleanly
  const tag = {
    id: tagId || undefined,
    name,
    description,
    color,
    user: session?.user.id,
  };

  try {
    const { data, error } = await supabase
      .from("Tags")
      .upsert(tag)
      .select(); // ensures updated row comes back

    if (error) throw error;

    // Clear inputs
    nameInput.value = "";
    descriptionInput.value = "";
    colorInput.value = "#000000";

    console.log("Upserted tag:", data);

      
    updateUI();

    return data;

  } catch (error) {
    console.error("Supabase error:", error);
    return null;
  }
};


export const deleteTag = async (event: PointerEvent, tagId: string) => {
  event.preventDefault();

  try {
    const { error } = await supabase
      .from("Tags")
      .delete()
            .eq("id", tagId);
    if (error) throw error;

    // Clear inputs
    updateUI();

  } catch (error) {
    console.error("Supabase error:", error);
    return null;
  }
};

export const clearTags = async () => {
    try {
        let query = supabase
        .from("Tags")
        .delete()
        .eq("user", session?.user.id); 
        
        const { error } = await query;

        if (error) throw error;

        updateUI();

    } catch (error) {
        console.error("Supabase error:", error);
        return null;
    }
};
