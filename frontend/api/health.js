import { cors, sendJson, getDb } from "./_db.js";

export default function handler(req, res) {
	if (cors(req, res)) return;

	const db = getDb();
	return sendJson(res, 200, {
		status: "online",
		service: "Netflix 2026 Production Serverless Backend API",
		environment: process.env.NODE_ENV || "production",
		version: "1.0.0",
		serverTime: new Date().toISOString(),
		totalUsers: db.users.length,
		database: "Cloud Serverless Database (Active)",
		endpoints: {
			auth: "/api/users",
			watchlist: "/api/users/watchlist",
			health: "/api/health",
		},
	});
}
