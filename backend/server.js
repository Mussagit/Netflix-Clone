require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const apiRoutes = require("./routes");
const db = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
	? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
	: ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"];

app.use(
	cors({
		origin: (origin, callback) => {
			// Allow non-browser requests (e.g. mobile apps, curl, server-to-server) or matched origins
			if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*") || NODE_ENV === "development") {
				return callback(null, true);
			}
			return callback(null, true); // Permissive in dev/staging
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health / Status Check Endpoint
app.get(["/", "/health"], (req, res) => {
	res.status(200).json({
		status: "online",
		service: "Netflix 2026 Production Backend API",
		environment: NODE_ENV,
		version: "1.0.0",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		endpoints: {
			auth: "/api/users",
			movies: "/api/movies",
			watchlist: "/api/users/watchlist",
		},
	});
});

// Mount All API Routes
app.use("/api", apiRoutes);

// Optional: Serve frontend static build if hosted together
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (process.env.SERVE_FRONTEND === "true") {
	app.use(express.static(frontendDist));
	app.get("*", (req, res) => {
		res.sendFile(path.join(frontendDist, "index.html"));
	});
}

// 404 Route Handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: `Route ${req.method} ${req.originalUrl} not found on this server.`,
	});
});

// Centralized Global Error Handler
app.use((err, req, res, _next) => {
	console.error("Unhandled Server Error:", err);
	res.status(err.status || 500).json({
		success: false,
		message: err.message || "Internal server error occurred.",
	});
});

// Server Initialization
const server = app.listen(PORT, () => {
	console.log(`======================================================`);
	console.log(`🎬 Netflix Clone Backend Server Active`);
	console.log(`⚡ Environment: [${NODE_ENV}]`);
	console.log(`🌐 Port: http://localhost:${PORT}`);
	console.log(`💚 Health Check: http://localhost:${PORT}/health`);
	console.log(`🚀 API Base URL: http://localhost:${PORT}/api`);
	console.log(`======================================================`);
});

server.on("error", (err) => {
	if (err.code === "EADDRINUSE") {
		console.error(`\n⚠️  Port ${PORT} is currently in use.`);
		console.error(`👉 Terminate the process using port ${PORT} or configure a different PORT in .env\n`);
	} else {
		console.error("Server execution error:", err);
	}
});

// Graceful Shutdown
const gracefulShutdown = (signal) => {
	console.log(`\nReceived ${signal}. Shutting down gracefully...`);
	server.close(() => {
		console.log("HTTP server closed.");
		if (db.pool) {
			db.pool.end().then(() => {
				console.log("Database connection pool closed.");
				process.exit(0);
			});
		} else {
			process.exit(0);
		}
	});
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = app;
