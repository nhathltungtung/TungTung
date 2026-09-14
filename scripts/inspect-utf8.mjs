import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4Mzg3NjgwMH0.placeholder";

console.log("--- KIỂM TRA UTF-8 TRONG POSTGRESQL ---");

try {
  // Lấy dữ liệu qua docker exec psql với client encoding UTF8
  const psqlItems = execSync(
    `docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -t -A -F" | " -c "SELECT code, name, unit FROM public.inventory_items WHERE category IN ('nhom', 'ton_lop', 'phu_kien') LIMIT 10;"`,
    { encoding: "utf8" }
  );
  console.log("Dữ liệu inventory_items qua psql (PGCLIENTENCODING=UTF8):");
  console.log(psqlItems);

  const psqlUom = execSync(
    `docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -t -A -F" | " -c "SELECT code, name, description FROM public.units_of_measure LIMIT 10;"`,
    { encoding: "utf8" }
  );
  console.log("Dữ liệu units_of_measure qua psql (PGCLIENTENCODING=UTF8):");
  console.log(psqlUom);

  const psqlProducts = execSync(
    `docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -t -A -F" | " -c "SELECT code, name, category, unit FROM public.products LIMIT 5;"`,
    { encoding: "utf8" }
  );
  console.log("Dữ liệu products qua psql:");
  console.log(psqlProducts);

  const psqlCash = execSync(
    `docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -t -A -F" | " -c "SELECT voucher_code, category, counterpart, note FROM public.cash_transactions LIMIT 5;"`,
    { encoding: "utf8" }
  );
  console.log("Dữ liệu cash_transactions qua psql:");
  console.log(psqlCash);

  const psqlSettings = execSync(
    `docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -t -A -F" | " -c "SELECT system_name, company_name, hotline FROM public.system_settings LIMIT 1;"`,
    { encoding: "utf8" }
  );
  console.log("Dữ liệu system_settings qua psql:");
  console.log(psqlSettings);

  const psqlProfiles = execSync(
    `docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -t -A -F" | " -c "SELECT full_name, email, role FROM public.profiles LIMIT 5;"`,
    { encoding: "utf8" }
  );
  console.log("Dữ liệu profiles qua psql:");
  console.log(psqlProfiles);
} catch (e) {
  console.error("Lỗi:", e.message);
}
