import { execSync } from "child_process";

const sql = `
DO $$
DECLARE
    r RECORD;
    v_count INT;
BEGIN
    FOR r IN (
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND data_type IN ('text', 'character varying')
    ) LOOP
        BEGIN
            EXECUTE format('SELECT count(*) FROM public.%I WHERE %I LIKE ''%%?%%''', r.table_name, r.column_name) INTO v_count;
            IF v_count > 0 THEN
                RAISE NOTICE 'CORRUPT_FIELD: %.% has % rows with ?', r.table_name, r.column_name, v_count;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- ignore
        END;
    END LOOP;
END $$;
`;

const res = execSync("docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres", {
  input: Buffer.from(sql, "utf8"),
  encoding: "utf8",
});
console.log("Result:", res);
