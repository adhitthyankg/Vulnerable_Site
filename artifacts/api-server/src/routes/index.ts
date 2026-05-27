import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import productsRouter from "./products";
import ordersRouter from "./orders";
import postsRouter from "./posts";
import commentsRouter from "./comments";
import ticketsRouter from "./tickets";
import uploadsRouter from "./uploads";
import notificationsRouter from "./notifications";
import employeesRouter from "./employees";
import apiKeysRouter from "./apiKeys";
import auditLogsRouter from "./auditLogs";
import analyticsRouter from "./analytics";
import scannerRouter from "./scanner";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(postsRouter);
router.use(commentsRouter);
router.use(ticketsRouter);
router.use(uploadsRouter);
router.use(notificationsRouter);
router.use(employeesRouter);
router.use(apiKeysRouter);
router.use(auditLogsRouter);
router.use(analyticsRouter);
router.use(scannerRouter);

export default router;
