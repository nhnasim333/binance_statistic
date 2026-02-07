import express from "express";
import { UserRoutes } from "../modules/User/user.route";
import { SymbolRoutes } from "../modules/Symbol/symbol.route";
import { PriceDataRoutes } from "../modules/PriceData/priceData.route";
import { SystemRoutes } from "./system.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/symbols",
    route: SymbolRoutes,
  },
  {
    path: "/price-data",
    route: PriceDataRoutes,
  },
  {
    path: "/system",
    route: SystemRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
