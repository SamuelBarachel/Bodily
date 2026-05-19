import { Router, type IRouter } from "express";
import healthRouter from "./health";
import summarizeRouter from "./summarize";
import entriesRouter from "./entries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(summarizeRouter);
router.use(entriesRouter);

export default router;
