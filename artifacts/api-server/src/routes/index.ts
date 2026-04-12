import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jarvisRouter from "./jarvis";
import componentsRouter from "./components";
import projectsRouter from "./projects";
import simulationRouter from "./simulation";
import documentationRouter from "./documentation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jarvisRouter);
router.use(componentsRouter);
router.use(projectsRouter);
router.use(simulationRouter);
router.use(documentationRouter);

export default router;
