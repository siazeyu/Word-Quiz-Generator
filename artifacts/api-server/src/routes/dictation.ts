import { Router, type IRouter } from "express";
import { inArray } from "drizzle-orm";
import { db, wordsTable } from "@workspace/db";
import { GenerateDictationPreviewBody, GenerateDictationPreviewResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/dictation/preview", async (req, res): Promise<void> => {
  const parsed = GenerateDictationPreviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { unitIds, direction, style, shuffle, showPhonetic, title } = parsed.data;

  const words = await db
    .select()
    .from(wordsTable)
    .where(inArray(wordsTable.unitId, unitIds))
    .orderBy(wordsTable.orderIndex);

  let items = words.map((word) => ({
    prompt: direction === "zh_to_en" ? word.chinese : word.english,
    answer: direction === "zh_to_en" ? word.english : word.chinese,
    phonetic: word.phonetic,
    partOfSpeech: word.partOfSpeech,
  }));

  if (shuffle) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j]!, items[i]!];
    }
  }

  if (!showPhonetic) {
    items = items.map((item) => ({ ...item, phonetic: null }));
  }

  res.json(
    GenerateDictationPreviewResponse.parse({
      title: title ?? "默写练习",
      direction,
      style,
      items,
      generatedAt: new Date().toISOString(),
    }),
  );
});

export default router;
