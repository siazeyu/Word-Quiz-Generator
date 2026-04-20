import { Router, type IRouter } from "express";
import healthRouter from "./health";
import textbooksRouter from "./textbooks";
import unitsRouter from "./units";
import wordsRouter from "./words";
import dictationRouter from "./dictation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(textbooksRouter);
router.use(unitsRouter);
router.use(wordsRouter);
router.use(dictationRouter);

export default router;
