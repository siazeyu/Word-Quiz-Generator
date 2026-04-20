import { Router, type IRouter } from "express";
import { eq, inArray, asc } from "drizzle-orm";
import { db, wordsTable, unitsTable, textbooksTable } from "@workspace/db";
import {
  ListWordsParams,
  CreateWordParams,
  CreateWordBody,
  UpdateWordParams,
  UpdateWordBody,
  DeleteWordParams,
  ImportWordsBody,
  ExportWordsParams,
  ListWordsResponse,
  UpdateWordResponse,
  ImportWordsResponse,
  ExportWordsResponse,
} from "@workspace/api-zod";
import { sd } from "../lib/serialize";
const router: IRouter = Router();

router.get("/units/:unitId/words", async (req, res): Promise<void> => {
  const params = ListWordsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const words = await db
    .select()
    .from(wordsTable)
    .where(eq(wordsTable.unitId, params.data.unitId))
    .orderBy(asc(wordsTable.orderIndex), asc(wordsTable.createdAt));
  res.json(ListWordsResponse.parse(words.map(sd)));
});

router.post("/units/:unitId/words", async (req, res): Promise<void> => {
  const params = CreateWordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateWordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await db.select().from(wordsTable).where(eq(wordsTable.unitId, params.data.unitId));
  const maxIndex = existing.length > 0 ? Math.max(...existing.map((w) => w.orderIndex)) : -1;
  const [word] = await db
    .insert(wordsTable)
    .values({ ...parsed.data, unitId: params.data.unitId, orderIndex: maxIndex + 1 })
    .returning();
  res.status(201).json(sd(word!));
});

router.post("/words/reorder", async (req, res): Promise<void> => {
  const { items } = req.body as { items?: { id: number; orderIndex: number }[] };
  if (!Array.isArray(items)) { res.status(400).json({ error: "items required" }); return; }
  for (const item of items) {
    await db.update(wordsTable).set({ orderIndex: item.orderIndex }).where(eq(wordsTable.id, item.id));
  }
  res.json({ ok: true });
});

router.patch("/words/:id", async (req, res): Promise<void> => {
  const params = UpdateWordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateWordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [word] = await db
    .update(wordsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(wordsTable.id, params.data.id))
    .returning();
  if (!word) {
    res.status(404).json({ error: "Word not found" });
    return;
  }
  res.json(UpdateWordResponse.parse(sd(word)));
});

router.delete("/words/:id", async (req, res): Promise<void> => {
  const params = DeleteWordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [word] = await db.delete(wordsTable).where(eq(wordsTable.id, params.data.id)).returning();
  if (!word) {
    res.status(404).json({ error: "Word not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/words/import", async (req, res): Promise<void> => {
  const parsed = ImportWordsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { unitId, words } = parsed.data;
  let imported = 0;

  const existing = await db.select().from(wordsTable).where(eq(wordsTable.unitId, unitId));
  let maxIndex = existing.length > 0 ? Math.max(...existing.map((w) => w.orderIndex)) : -1;

  for (const word of words) {
    try {
      maxIndex++;
      await db.insert(wordsTable).values({
        ...word,
        unitId,
        phonetic: word.phonetic ?? null,
        partOfSpeech: word.partOfSpeech ?? null,
        orderIndex: maxIndex,
      });
      imported++;
    } catch {
      // skip failed inserts
    }
  }

  res.json(ImportWordsResponse.parse({ imported, total: words.length }));
});

router.get("/units/:unitId/words/export", async (req, res): Promise<void> => {
  const params = ExportWordsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const words = await db
    .select()
    .from(wordsTable)
    .where(eq(wordsTable.unitId, params.data.unitId))
    .orderBy(asc(wordsTable.orderIndex), asc(wordsTable.createdAt));

  const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, params.data.unitId));
  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  const [textbook] = await db.select().from(textbooksTable).where(eq(textbooksTable.id, unit.textbookId));

  res.json(
    ExportWordsResponse.parse({
      unitName: unit.name,
      textbookName: textbook?.name ?? "",
      words: words.map(sd),
    }),
  );
});

export default router;
