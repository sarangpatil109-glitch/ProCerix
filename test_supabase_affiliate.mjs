import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .limit(1);
    
  if (error) {
    console.error("Error fetching partners:", error);
  } else {
    console.log("Success fetching partners:", data);
  }
}

test();
