const cors = require("cors");

// Define allowed origins from environment or use default localhost values
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) =>
      o.trim().replace(/\/$/, "")
    )
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:9004",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:9004",
      "http://192.168.29.22:9002",
      "http://192.168.29.229:3000",
      "http://192.168.29.229:9004"
    ];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Origin received:", origin);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Normalize origin (remove trailing slash, lowercase)
    const cleanedOrigin = origin.replace(/\/$/, "").toLowerCase();
    // Normalize allowed origins
    const normalizedAllowed = allowedOrigins.map((o) =>
      o.replace(/\/$/, "").toLowerCase()
    );

    // Debug logging
    console.log("Cleaned origin:", cleanedOrigin);
    console.log("Normalized allowed origins:", normalizedAllowed);

    // Allow all localhost and 127.0.0.1 (any port, any protocol)
    const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
    const lanRegex = /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/i;
    if (localhostRegex.test(cleanedOrigin) || lanRegex.test(cleanedOrigin)) {
      console.log("Allowed by localhost/127.0.0.1/192.168.x.x rule");
      return callback(null, true);
    }

    if (
      normalizedAllowed.includes("*") ||
      normalizedAllowed.includes(cleanedOrigin)
    ) {
      console.log("Allowed by allowedOrigins rule");
      return callback(null, true);
    }

    console.log("CORS rejected origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);





