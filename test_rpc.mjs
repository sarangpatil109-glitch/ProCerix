import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.rpc("exec_sql", { query: "SELECT 1;" });
  if (error) {
    console.error("exec_sql error:", error);
  } else {
    console.log("exec_sql success:", data);
  }
}

test();
