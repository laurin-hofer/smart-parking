const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const dns = require("dns").promises;

const envPath = path.join(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    process.env[key] ??= rawValue.replace(/^"|"$/g, "");
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in .env");
  }
  // Proactively check DNS to detect IPv4/IPv6 availability and provide
  // a clearer error message when Supabase Direct Connection is IPv6-only.
  try {
    const connectionUrl = new URL(process.env.DATABASE_URL);
    const hostname = connectionUrl.hostname;

    let hasV4 = false;
    let hasV6 = false;
    try {
      const v4 = await dns.resolve4(hostname);
      hasV4 = Array.isArray(v4) && v4.length > 0;
    } catch (e) {
      hasV4 = false;
    }
    try {
      const v6 = await dns.resolve6(hostname);
      hasV6 = Array.isArray(v6) && v6.length > 0;
    } catch (e) {
      hasV6 = false;
    }

    if (!hasV4 && hasV6) {
      console.error("Host resolves only to IPv6 addresses (no IPv4 A records found).");
      console.error("Likely cause: your machine or network does not support IPv6 or cannot reach IPv6 DNS.");
      console.error("Fix: In Supabase, copy Project Settings > Database > Connection Pooler > URI");
      console.error("and use that as DATABASE_URL instead of the Direct Connection URI, or enable the IPv4 add-on.");
      process.exitCode = 1;
      return;
    }
    if (!hasV4 && !hasV6) {
      console.error("Host did not resolve to A or AAAA records (DNS lookup failed).");
      console.error("Check your network DNS settings or try a different resolver (e.g., 1.1.1.1 / 8.8.8.8).");
      process.exitCode = 1;
      return;
    }
  } catch (err) {
    // If URL parsing or DNS lookup fails, fall through to the normal connection attempt
    // and let the pg client report the original error.
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10_000
  });

  try {
    const info = await pool.query("SELECT current_database() AS database, current_schema() AS schema, NOW() AS now");
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("Connected:", JSON.stringify(info.rows[0]));
    console.log("Tables:", tables.rows.map((row) => row.table_name).join(", ") || "(none)");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Database check failed:", error.message);
  if (String(error.message).includes("ENOTFOUND") || String(error.message).includes("timeout")) {
    console.error("");
    console.error("Likely cause: Supabase Direct Connection hosts are often IPv6-only.");
    console.error("Fix: In Supabase, copy Project Settings > Database > Connection Pooler > URI");
    console.error("and use that as DATABASE_URL instead of the Direct Connection URI.");
  }
  process.exitCode = 1;
});
