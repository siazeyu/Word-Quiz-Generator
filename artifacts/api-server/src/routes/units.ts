import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, unitsTable } from "@workspace/db";
import {
  ListUnitsParams,
  CreateUnitParams,
  CreateUnitBody,
  UpdateUnitParams,
  UpdateUnitBody,
  DeleteUnitParams,
  ListUnitsResponse,
  UpdateUnitResponse,
} from "@workspace/api-zod";
import { sd } from "../lib/serialize";
const router: IRouter = Router();

router.get("/textbooks/:textbookId/units", async (req, res): Promise<void> => {
  const params = ListUnitsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const units = await db
    .select()
    .from(unitsTable)
    .where(eq(unitsTable.textbookId, params.data.textbookId))
    .orderBy(asc(unitsTable.orderIndex), asc(unitsTable.createdAt));
  res.json(ListUnitsResponse.parse(units.map(sd)));
});

router.post("/textbooks/:textbookId/units", async (req, res): Promise<void> => {
  const params = CreateUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateUnitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await db.select().from(unitsTable).where(eq(unitsTable.textbookId, params.data.textbookId));
  const maxIndex = existing.length > 0 ? Math.max(...existing.map((u) => u.orderIndex)) : -1;
  const [unit] = await db
    .insert(unitsTable)
    .values({ ...parsed.data, textbookId: params.data.textbookId, orderIndex: maxIndex + 1 })
    .returning();
  res.status(201).json(sd(unit!));
});

router.post("/units/reorder", async (req, res): Promise<void> => {
  const { items } = req.body as { items?: { id: number; orderIndex: number }[] };
  if (!Array.isArray(items)) { res.status(400).json({ error: "items required" }); return; }
  for (const item of items) {
    await db.update(unitsTable).set({ orderIndex: item.orderIndex }).where(eq(unitsTable.id, item.id));
  }
  res.json({ ok: true });
});

router.patch("/units/:id", async (req, res): Promise<void> => {
  const params = UpdateUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUnitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [unit] = await db
    .update(unitsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(unitsTable.id, params.data.id))
    .returning();
  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }
  res.json(UpdateUnitResponse.parse(sd(unit)));
});

router.delete("/units/:id", async (req, res): Promise<void> => {
  const params = DeleteUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [unit] = await db.delete(unitsTable).where(eq(unitsTable.id, params.data.id)).returning();
  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
