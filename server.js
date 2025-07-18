import Fastify from "fastify";
import dotenv from "dotenv";
import path from "path";
import { join } from "path";

dotenv.config();
// uitls==================================================
import {
  fastifySwaggerConfig,
  fastifySwaggerUiConfig,
} from "./config/swagger.config.js";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifySwagger from "@fastify/swagger";
import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
// Routes=============================================
import authRouters from "./routes/auth.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const fastify = Fastify({ logger: true });

import dbConnected from "./config/mongodb.config.js";
import fastifyCookie from "@fastify/cookie";
import { fileURLToPath } from "url";

const server = async () => {
  try {
    const port = process.env.PORT || 3000;
    fastify.register(dbConnected);
    // ======================================================
    fastify.register(fastifyMultipart, {
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
        fieldNameSize: 300,
        fields: 10,
      },
    });
    // ======================================================
    fastify.register(fastifyJwt, {
      secret: process.env.JWT_SECRET_KEY,
    });
    fastify.register(fastifyCookie, {
      secret: process.env.COOKIE_SECRET_KEY,
    });
    // =======================================================
    fastify.register(fastifyCors, {
      origin: "http://192.168.1.100:3000", // در حالت توسعه می‌تونی "*" رو بذاری. ولی بهتره در تولید دامنه خاصی رو تعیین کنی
      methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      preflightContinue: true,
    });

    fastify.register(fastifyStatic, {
      root: join(process.cwd(), "uploads"),
      prefix: "/uploads/",
    });
    // =====================================================
    fastify.register(fastifySwagger, fastifySwaggerConfig);
    fastify.register(fastifySwaggerUi, fastifySwaggerUiConfig);
    // ====================================================
    fastify.register(authRouters, { prefix: "/auth" });

    fastify.listen(
      { port: process.env.PORT || 3000, host: "0.0.0.0" },
      (err, address) => {
        if (err) {
          console.error("❌ Server Error:", err);
          process.exit(1);
        }
        console.log(`🛜✅ Server running at: ${address}`);
      }
    );
  } catch (error) {}
};
server();
