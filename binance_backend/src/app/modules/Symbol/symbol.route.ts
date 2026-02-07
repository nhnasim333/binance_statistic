import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { SymbolValidation } from "./symbol.validation";
import { SymbolController } from "./symbol.controller";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../User/user.const";

const router = express.Router();

router.post(
  "/",
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  validateRequest(SymbolValidation.createSymbolValidationSchema),
  SymbolController.createSymbol
);

router.post(
  "/bulk",
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  SymbolController.bulkCreateSymbols
);

router.get("/", SymbolController.getAllSymbols);

router.get("/list", SymbolController.getAllSymbolsList);

router.get("/active", SymbolController.getAllSymbolsList);

router.get("/:id", SymbolController.getSymbolById);

router.patch(
  "/:id",
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  validateRequest(SymbolValidation.updateSymbolValidationSchema),
  SymbolController.updateSymbol
);

router.delete(
  "/:id",
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  SymbolController.deleteSymbol
);

export const SymbolRoutes = router;
