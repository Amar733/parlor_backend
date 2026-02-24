// ...existing code...
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

// Import custom middleware
const corsMiddleware = require("./middleware/cors");
const {
  rateLimits,
  helmetConfig,
  requestLogger,
  errorHandler,
  notFoundHandler,
} = require("./middleware/security");
const { serveFile } = require("./middleware/upload");
const { activityLogger } = require("./middleware/activityLogger");
const { roleBasedFilter } = require("./middleware/roleBasedFilter");

const app = express();

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Debug: Log all incoming requests and their bodies (after body parser)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Request body:", req.body);
  next();
});

// Trust proxy for accurate IP addresses (if behind proxy/load balancer)
app.set("trust proxy", 1);

// Security middleware
app.use(helmetConfig);

// CORS middleware
app.use(corsMiddleware);

// Request logging
app.use(requestLogger);

// Activity logging middleware (should be after auth middleware is applied to routes)
app.use(
  activityLogger({
    logAllRequests: process.env.LOG_ALL_REQUESTS === "true",
    logAuth: true,
    logCrud: true,
    logFiles: true,
    excludePaths: ["/health", "/api$", "/uploads"],
    excludeMethods: ["OPTIONS"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/srm_backend";
const dbName = process.env.MONGODB_DB || "srk_arnkin";
console.log("Connecting to MongoDB with URI:", mongoUri, "and DB:", dbName);
mongoose
  .connect(mongoUri, {
    dbName,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Apply rate limiting to different route groups
// app.use('/api/auth', rateLimits.auth);
app.use("/api/upload", rateLimits.upload);

// Public routes (higher rate limit)
app.use("/api/services", rateLimits.public);
app.use("/api/portfolio", rateLimits.public);
app.use("/api/testimonials", rateLimits.public);

// Protected routes (standard rate limit)
// app.use('/api', rateLimits.api);
//
// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/public", require("./routes/public"));

// Apply role-based filtering to protected routes
app.use("/api", roleBasedFilter());

app.use("/api/profile", require("./routes/profile"));
app.use("/api/patients", require("./routes/patients"));
app.use("/api/appointments", require("./routes/appointments"));

app.use("/api/patient-visits", require("./routes/patientVisit"));
app.use("/api/chambers", require("./routes/chamber"));
app.use("/api/doctor-visiting", require("./routes/doctorVisiting"));
app.use("/api/services", require("./routes/services"));
app.use("/api/portfolio", require("./routes/portfolio"));
app.use("/api/testimonials", require("./routes/testimonials"));
app.use("/api/blood-reports", require("./routes/bloodReports"));
app.use("/api/prescriptions", require("./routes/prescriptions"));
app.use("/api/users", require("./routes/managedUsers"));
app.use("/api/coupons", require("./routes/coupons"));
app.use("/api/permissions", require("./routes/permissions"));
app.use("/api/role-matrix", require("./routes/roleMatrix"));
app.use("/api/activity-log", require("./routes/activityLogs"));
app.use("/api/summaries", require("./routes/summaries"));
app.use("/api/blog", require("./routes/blog"));
app.use("/api/cms", require("./routes/cms"));
app.use("/api/doctor/cms", require("./routes/doctorCms"));
app.use("/api/parlor/cms", require("./routes/parlorCms"));
app.use("/api/bin", require("./routes/bin"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/timeslots", require("./routes/timeslots"));
app.use("/api/activities", require("./routes/activities"));
app.use("/api/actions", require("./routes/actions"));
app.use("/uploads", require("./routes/fileServer"));

app.use("/api/appointment-booking", require("./routes/appointmentBooking"));
app.use("/api/agora", require("./routes/agora"));

app.use("/api", require("./routes/product"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/purchase", require("./routes/purchase"));
app.use("/api/stock", require("./routes/stock"));
app.use("/api/finance", require("./routes/finance"));
app.use("/api/company-settings", require("./routes/company"));
app.use("/api/packages", require("./routes/packages"));
app.use("/api/doctor-settings", require("./routes/doctorSettings"));
app.use("/api/prescription-settings", require("./routes/prescriptionSettings"));
app.use("/api/settings/access-time", require("./routes/accessTime"));
// app.use("/api/bulk-delete", require("./routes/bulkDelete"));

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API info route
app.get("/api", (req, res) => {
  res.json({
    name: "SRM Backend API",
    version: "1.0.0",
    description: "Patient Record Management Backend API",
    endpoints: {
      appointments: "/api/appointments",
      bloodReports: "/api/blood-reports",
      bloodTests: "/api/blood-tests",
      patients: "/api/patients",
      patientVisits: "/api/patient-visits",
      managedUsers: "/api/managed-users",
      profile: "/api/profile",
      auth: "/api/auth",
      prescriptions: "/api/prescriptions",
      summaries: "/api/summaries",
      coupons: "/api/coupons",
      services: "/api/services",
      portfolio: "/api/portfolio",
      testimonials: "/api/testimonials",
      blog: "/api/blog",
      cms: "/api/cms",
      timeslots: "/api/timeslots",
      activities: "/api/activities",
      activityLogs: "/api/activity-logs",
      permissions: "/api/permissions",
      actions: "/api/actions",
      uploads: "/uploads",
      appointmentBooking: "/api/appointment-booking",
      roleMatrix: "/api/role-matrix",
      sales: "/api/sales",
      purchase: "/api/purchase",
      stock: "/api/stock",
      finance: "/api/finance",
      company: "/api/company",
      packages: "/api/packages",
      prescriptionSettings: "/api/prescription-settings",
      accessTime: "/api/settings/access-time",
    },
    publicEndpoints: [
      "GET /api/public/doctors",
      "GET /api/public/doctors/:id",
      "GET /api/public/specializations",
      "GET /api/services",
      "GET /api/portfolio",
      "GET /api/testimonials",
      "GET /api/activities",
      "GET /api/activities/:id",
      "GET /api/blog",
      "GET /api/cms/:page/:section",
      "POST /api/appointments",
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /uploads/:filename",
      "GET /api/timeslots",
      "GET /api/timeslots/availability/:doctorId/:date",
      "GET /api/appointment-booking/check-availability",
      "POST /api/appointment-booking/book",
      "PUT /api/appointment-booking/cancel/:appointmentId",
    ],
    adminEndpoints: [
      "GET /api/bin",
      "POST /api/bin/restore",
      "DELETE /api/bin/permanent",
      "POST /api/bin/cleanup",
      "GET /api/bin/stats",
    ],
  });
});

// 404 handler
app.use("*", notFoundHandler);

// Error handling middleware
app.use(errorHandler);

const http = require('http');
const path = require("path");
const initMeetingCron = require('./cron/meetingCron');
const { Server } = require("socket.io");
const meetingSocket = require("./sockets/meetingSocket");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this to match your frontend URL in production
    methods: ["GET", "POST"]
  }
});

// Initialize socket handlers
meetingSocket(io);

const PORT = process.env.PORT || 3000;

// Start Cron Jobs
initMeetingCron();

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
