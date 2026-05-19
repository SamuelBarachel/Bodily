import { Router, type Request, type Response } from "express";
import { getFirestore } from "../lib/firebase";

const router = Router();

function userEntries(userId: string) {
  return getFirestore().collection("users").doc(userId).collection("entries");
}

router.get("/entries", async (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    res.status(400).json({ error: "userId query parameter is required" });
    return;
  }

  const snapshot = await userEntries(userId).get();
  const entries: Record<string, unknown> = {};
  snapshot.forEach((doc) => {
    entries[doc.id] = doc.data();
  });

  res.json({ entries });
});

router.put("/entries/:date", async (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const { date } = req.params;
  if (!userId) {
    res.status(400).json({ error: "userId query parameter is required" });
    return;
  }

  const entry = req.body;
  await userEntries(userId).doc(String(date)).set(entry);
  res.json(entry);
});

router.delete("/entries/:date", async (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const { date } = req.params;
  if (!userId) {
    res.status(400).json({ error: "userId query parameter is required" });
    return;
  }

  await userEntries(userId).doc(String(date)).delete();
  res.json({ ok: true });
});

export default router;
