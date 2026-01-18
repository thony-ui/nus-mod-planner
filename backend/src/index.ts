import bodyParser from "body-parser";
import express from "express";
import cors from "cors"; // Add this import
import { defineModuleRoutes } from "./modules/nus-module";
import { Server } from "http";
import { defineUserRoutes } from "./modules/user";
import { definePlanRoutes } from "./modules/plan";
import { defineProgrammeRoutes } from "./modules/programme/entry-point/api/routes";
import { defineNTUModuleRoutes } from "./modules/ntu-module/entry-point/api/routes";

require("dotenv").config(); // Load environment variables from .env file

const app = express();

// Configure CORS properly
// test deployment
app.use(
  cors({
    origin: [
      process.env.ALLOWED_ORIGIN_DEVELOPMENT!, // Development origin
      process.env.ALLOWED_ORIGIN_PRODUCTION!,
      process.env.ALLOWED_API_GATEWAY_ORIGIN!, // API Gateway origin
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(bodyParser.json());
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

defineUserRoutes(app);
defineModuleRoutes(app);
definePlanRoutes(app);
defineProgrammeRoutes(app);
defineNTUModuleRoutes(app);

const port = process.env.USER_SERVICE_PORT || 8000;
let server: Server;
server = app.listen(port, () => {
  console.log(`Backend server is running on port ${port}!`);
});

export { app, server };
