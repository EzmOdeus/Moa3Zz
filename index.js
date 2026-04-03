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

// ✅ إعداد trust proxy بشكل ذكي حسب البيئة
if (process.env.NODE_ENV === 'production') {
  // في الإنتاج: ثق في البروكسي الأول فقط (أكثر أماناً)
  app.set('trust proxy', 1);
} else {
  // في التطوير: ثق في الـ localhost فقط
  app.set('trust proxy', 'loopback');
}

// ✅ تحسين إعدادات rate limit للعمل خلف البروكسي
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
  // ✅ استخدام الـ IP الحقيقي من وراء البروكسي
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  },
  // ✅ تجاهل الهيدر إذا لم يكن موثوقاً (اختياري)
  validate: { xForwardedForHeader: false } // أو true مع trust proxy مضبوط
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
    // ✅ عرض الـ IP الذي يراه التطبيق للتأكد
    clientIP: req.ip,
    forwardedFor: req.headers['x-forwarded-for'],
  });
});

// Error handling
app.use(errorHandler);

// ✅ تصدير التطبيق للمنصات السحابية
module.exports = app;

// ✅ تشغيل السيرفر محلياً فقط
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
