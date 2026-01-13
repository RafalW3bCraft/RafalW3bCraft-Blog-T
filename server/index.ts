import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketService } from "./websocket";
import { setupAuth } from "./auth";
import { aiBlogGenerator } from "./ai-blog-generator";
import { continuousAgent } from "./continuous-agent";
import { falconProtocol } from "./falcon-protocol";
import { runMigrations } from "./migrate";
import { 
  securityHeaders, 
  corsOptions, 
  compressionMiddleware, 
  requestLogger, 
  sanitizeInput, 
  apiLimiter 
} from "../lib/security";
import cors from "cors";

const app = express();

app.set('trust proxy', 1);

app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(compressionMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

app.use(sanitizeInput);

app.use('/api/', apiLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

const server = createServer(app);

(async () => {
  // Run database migrations first
  console.log('🔄 Running database migrations...');
  try {
    await runMigrations();
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    console.warn('⚠️  Continuing despite migration error - tables may already exist');
  }

  await setupAuth(app);
  
  await registerRoutes(app, server);
  
  const wsService = new WebSocketService(server);
  
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }


})();
