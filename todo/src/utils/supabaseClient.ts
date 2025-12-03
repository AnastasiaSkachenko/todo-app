import { createClient } from '@supabase/supabase-js';


//if (!process.env.ANON_DATABASE_KEY || !process.env.DATABASE_URL) {
//    throw new Error("Cound not reach env variables")
//}

//export const supabase = createClient(
//  process.env.DATABASE_URL,
 // process.env.ANON_DATABASE_KEY,
//);


const supabaseUrl = import.meta.env.VITE_DATABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_ANON_DATABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Could not reach env variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);