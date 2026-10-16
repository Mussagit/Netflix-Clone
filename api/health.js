import { cors, sendJson, getDb } from "./_db.js";

export default function handler(req, res) {
	if (cors(req, res)) return;

	const db = getDb();
	const hasMysqlConfig = Boolean(process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.DB_HOST);

	return sendJson(res, 200, {
		status: "online",
		service: "Netflix 2026 Production Dynamic Backend API",
		environment: process.env.NODE_ENV || "production",
		version: "2.0.0",
		serverTime: new Date().toISOString(),
		totalUsers: db.users.length,
		databaseEngine: hasMysqlConfig ? "MySQL Connection Pool (Dynamic Cloud Database)" : "Dynamic Persistent Database Engine",
		endpoints: {
			auth: "/api/users",
			register: "/api/users/register",
			login: "/api/users/login",
			watchlist: "/api/users/watchlist",
			health: "/api/health",
		},
	});
}
