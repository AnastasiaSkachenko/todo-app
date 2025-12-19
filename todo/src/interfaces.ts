import type { User } from '@supabase/supabase-js';

export interface Tag {
    id: string,
    name: string,
    created_at: string,
    color: string,
    description?: string
}

 
export interface Todo {
    id: string,
    name: string,
    description?: string,
    done: boolean,
    deadline: string,
    created_at: Date,
    updated_at: Date,
    user: User,
    tags?: Tag[]
}

export type FilterOption = "all" | "dateCreated" | "done"  | "notDone" | "deadline" | "tag";
export type SortOption =  "all" | "dateCreated" | "deadline";