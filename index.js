require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const database = require("./src/config/database");
const videoRoutes = require("./src/routes/videoRoutes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP",
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(limiter);

// Routes
app.use("/api", videoRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: database.getConnectionStatus(),
  });
});

// Error handling
app.use(errorHandler);

// ✅ تصدير التطبيق للمنصات السحابية
module.exports = app;

// ✅ تشغيل السيرفر محلياً فقط (عندما لا يكون في بيئة serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const startServer = async () => {
    try {
      await database.connect();
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🎥 Videos API: http://localhost:${PORT}/api/videos`);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  };

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down gracefully...");
    await database.disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("Shutting down gracefully...");
    await database.disconnect();
    process.exit(0);
  });

  startServer();
}
