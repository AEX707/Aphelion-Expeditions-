// Shared Supabase client — used by partner.html, login.html, partner-dashboard.html.
// Requires the Supabase JS library to be loaded first:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL = "https://agjmcokrlftutvnddohv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vsbAvQlf9in0HDYZeP8asQ_znoG1onN";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
