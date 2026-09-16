import { supabase } from "./supabase.js";
import { redirectTo } from "./redirect.js";

const { data: { session } } = await supabase.auth.getSession();

if (!session) {
    redirectTo("index.html");
}

export { supabase };