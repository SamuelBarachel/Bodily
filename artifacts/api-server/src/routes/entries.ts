import { Router, type IRouter } from "express";
import pg from "pg";

const { Pool } = pg;

let pool: InstanceType<typeof Pool> | null = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

async function ensureTable() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        user_id TEXT NOT NULL,
        date    TEXT NOT NULL,
        data    JSONB NOT NULL,
        PRIMARY KEY (user_id, date)
      )
    `);
  } finally {
    client.release();
  }
}

const tableReady = ensureTable().catch((err) => {
  console.error("Failed to create journal_entries table:", err);
});

const router: IRouter = Router();

router.get("/entries", async (req, res): Promise<void> => {
  await tableReady;
  const { userId } = req.query as { userId?: string };
  if (!userId) {
    res.status(400).json({ entries: {} });
    return;
  }
  try {
    const result = await getPool().query(
      "SELECT date, data FROM journal_entries WHERE user_id = $1",
      [userId]
    );
    const entries: Record<string, unknown> = {};
    for (const row of result.rows) {
      entries[row.date] = row.data;
    }
    res.json({ entries });
  } catch (err) {
    console.error("GET /entries error:", err);
    res.status(500).json({ entries: {} });
  }
});

router.put("/entries/:date", async (req, res): Promise<void> => {
  await tableReady;
  const { date } = req.params;
  const { userId } = req.query as { userId?: string };
  const entry = req.body;
  if (!userId || !date || !entry) {
    res.status(400).json({ ok: false });
    return;
  }
  try {
    await getPool().query(
      `INSERT INTO journal_entries (user_id, date, data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date) DO UPDATE SET data = EXCLUDED.data`,
      [userId, date, JSON.stringify(entry)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /entries/:date error:", err);
    res.status(500).json({ ok: false });
  }
});

router.delete("/entries/:date", async (req, res): Promise<void> => {
  await tableReady;
  const { date } = req.params;
  const { userId } = req.query as { userId?: string };
  if (!userId || !date) {
    res.status(400).json({ ok: false });
    return;
  }
  try {
    await getPool().query(
      "DELETE FROM journal_entries WHERE user_id = $1 AND date = $2",
      [userId, date]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /entries/:date error:", err);
    res.status(500).json({ ok: false });
  }
});

export default router;
