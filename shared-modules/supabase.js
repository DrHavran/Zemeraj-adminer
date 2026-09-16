import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://ldlewyxyjvpnazgquxcv.supabase.co";
const supabaseKey = "sb_publishable_lMFrNHzcuwsxA2nkN48GgA_BkmoPDUo";

export const supabase = createClient(supabaseUrl, supabaseKey);