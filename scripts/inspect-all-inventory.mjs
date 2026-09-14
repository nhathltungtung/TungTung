import { execSync } from "child_process";

const sql = `
SELECT code, name, unit, category FROM public.inventory_items ORDER BY code;
`;

const res = execSync("docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -t -A -F\" | \"", {
  input: Buffer.from(sql, "utf8"),
  encoding: "utf8"
});

console.log("=== ALL INVENTORY ITEMS IN DATABASE ===");
console.log(res);
