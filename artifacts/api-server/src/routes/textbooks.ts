import { Router, type IRouter } from "express";
import { eq, count, asc } from "drizzle-orm";
import { db, textbooksTable, unitsTable, wordsTable } from "@workspace/db";
import {
  CreateTextbookBody,
  UpdateTextbookParams,
  UpdateTextbookBody,
  DeleteTextbookParams,
  GetTextbookParams,
  ListTextbooksResponse,
  GetTextbookResponse,
  UpdateTextbookResponse,
  GetStatsSummaryResponse,
} from "@workspace/api-zod";
import { sd } from "../lib/serialize";
const router: IRouter = Router();

router.get("/textbooks", async (_req, res): Promise<void> => {
  const textbooks = await db.select().from(textbooksTable).orderBy(asc(textbooksTable.orderIndex), asc(textbooksTable.createdAt));
  res.json(ListTextbooksResponse.parse(textbooks.map(sd)));
});

router.post("/textbooks", async (req, res): Promise<void> => {
  const parsed = CreateTextbookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await db.select().from(textbooksTable).orderBy(asc(textbooksTable.orderIndex), asc(textbooksTable.createdAt));
  const maxIndex = existing.length > 0 ? Math.max(...existing.map((t) => t.orderIndex)) : -1;
  const [textbook] = await db.insert(textbooksTable).values({ ...parsed.data, orderIndex: maxIndex + 1 }).returning();
  res.status(201).json(GetTextbookResponse.parse(sd(textbook!)));
});

router.post("/textbooks/reorder", async (req, res): Promise<void> => {
  const { items } = req.body as { items?: { id: number; orderIndex: number }[] };
  if (!Array.isArray(items)) { res.status(400).json({ error: "items required" }); return; }
  for (const item of items) {
    await db.update(textbooksTable).set({ orderIndex: item.orderIndex }).where(eq(textbooksTable.id, item.id));
  }
  res.json({ ok: true });
});

router.get("/textbooks/:id", async (req, res): Promise<void> => {
  const params = GetTextbookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [textbook] = await db.select().from(textbooksTable).where(eq(textbooksTable.id, params.data.id));
  if (!textbook) {
    res.status(404).json({ error: "Textbook not found" });
    return;
  }
  res.json(GetTextbookResponse.parse(sd(textbook)));
});

router.patch("/textbooks/:id", async (req, res): Promise<void> => {
  const params = UpdateTextbookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTextbookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [textbook] = await db
    .update(textbooksTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(textbooksTable.id, params.data.id))
    .returning();
  if (!textbook) {
    res.status(404).json({ error: "Textbook not found" });
    return;
  }
  res.json(UpdateTextbookResponse.parse(sd(textbook)));
});

router.delete("/textbooks/:id", async (req, res): Promise<void> => {
  const params = DeleteTextbookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [textbook] = await db.delete(textbooksTable).where(eq(textbooksTable.id, params.data.id)).returning();
  if (!textbook) {
    res.status(404).json({ error: "Textbook not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const [textbooksCount] = await db.select({ count: count() }).from(textbooksTable);
  const [unitsCount] = await db.select({ count: count() }).from(unitsTable);
  const [wordsCount] = await db.select({ count: count() }).from(wordsTable);
  res.json(
    GetStatsSummaryResponse.parse({
      totalTextbooks: Number(textbooksCount?.count ?? 0),
      totalUnits: Number(unitsCount?.count ?? 0),
      totalWords: Number(wordsCount?.count ?? 0),
    }),
  );
});

export default router;
