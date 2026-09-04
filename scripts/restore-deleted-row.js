#!/usr/bin/env node
/**
 * Admin recovery tool for the deleted_rows_backup safety net (see
 * supabase/migrations/0008_deleted_rows_backup.sql). Every row deleted from
 * orders, checks, or fix_requests is captured here before it's gone —
 * this script lists what's recoverable and restores it on request.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in the
 * environment (or .env.local, loaded automatically).
 *
 * Usage:
 *   node scripts/restore-deleted-row.js list [tableName] [userEmailOrId]
 *   node scripts/restore-deleted-row.js restore <backupRowId>
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Minimal .env.local loader — avoids adding a dotenv dependency for one script.
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function list(tableName, userFilter) {
  let query = admin
    .from("deleted_rows_backup")
    .select("*")
    .is("restored_at", null)
    .order("deleted_at", { ascending: false })
    .limit(50);
  if (tableName) query = query.eq("table_name", tableName);

  const { data, error } = await query;
  if (error) throw error;

  const rows = userFilter
    ? data.filter((r) => JSON.stringify(r.row_data.user_id ?? "").includes(userFilter))
    : data;

  if (rows.length === 0) {
    console.log("Nothing recoverable matches that filter.");
    return;
  }
  for (const r of rows) {
    console.log(
      `[backup id ${r.id}] ${r.table_name} row ${r.row_id} — deleted ${r.deleted_at}\n  ${JSON.stringify(r.row_data)}\n`,
    );
  }
}

async function restore(backupId) {
  const { data: backup, error } = await admin
    .from("deleted_rows_backup")
    .select("*")
    .eq("id", backupId)
    .single();
  if (error || !backup) throw error ?? new Error("Backup row not found");
  if (backup.restored_at) {
    console.log("Already restored at", backup.restored_at);
    return;
  }

  const { error: insertError } = await admin.from(backup.table_name).insert(backup.row_data);
  if (insertError) throw insertError;

  await admin.from("deleted_rows_backup").update({ restored_at: new Date().toISOString() }).eq("id", backupId);
  console.log(`Restored ${backup.table_name} row ${backup.row_id}.`);
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === "list") {
    await list(args[0], args[1]);
  } else if (cmd === "restore") {
    if (!args[0]) throw new Error("Usage: restore <backupRowId>");
    await restore(Number(args[0]));
  } else {
    console.log(__filename.split(/[\\/]/).pop() + " — list [table] [userFilter] | restore <backupRowId>");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
