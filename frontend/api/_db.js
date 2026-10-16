// Dynamic Unified Database Engine for Netflix Clone (Vercel Serverless & Node.js)
// Supports MySQL (cloud/local) and dynamic JSON persistence without hardcoded mock data

import crypto from "crypto";
import fs from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "netflix_jwt_secret_key_2026_super_secure";

// Determine writable database file path
const isServerless = Boolean(
	process.env.VERCEL ||
	process.env.AWS_LAMBDA_FUNCTION_NAME ||
	process.env.LAMBDA_TASK_ROOT
);
const DB_FILE = isServerless ? path.join("/tmp", "netflix.db.json") : path.join(process.cwd(), "netflix.db.json");

// Dynamic In-Memory Store (Zero hardcoded users)
let db = {
	users: [],
	watchlist: [],
	preferences: [],
};

// Load existing persisted data if available
try {
	if (fs.existsSync(DB_FILE)) {
		const raw = fs.readFileSync(DB_FILE, "utf-8");
		const parsed = JSON.parse(raw);
		db = {
			users: Array.isArray(parsed.users) ? parsed.users : [],
			watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : [],
			preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
		};
	}
} catch (e) {
	console.log("Dynamic store init note:", e.message);
}

export function saveDb() {
	try {
		fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
	} catch (err) {
		console.warn("Storage sync note:", err.message);
	}
}

export function getDb() {
	return db;
}

// Optional Dynamic MySQL Pool
let mysqlPool = null;
let useMysql = false;

async function getMysqlPool() {
	if (mysqlPool) return mysqlPool;
	const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;
	const dbHost = process.env.DB_HOST;

	if (connectionUri || dbHost) {
		try {
			const mysql = await import("mysql2/promise");
			if (connectionUri) {
				mysqlPool = mysql.default.createPool({
					uri: connectionUri,
					ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
					waitForConnections: true,
					connectionLimit: 10,
					queueLimit: 0,
				});
			} else {
				mysqlPool = mysql.default.createPool({
					host: dbHost || "localhost",
					user: process.env.DB_USER || "root",
					password: process.env.DB_PASSWORD || "",
					database: process.env.DB_NAME || "netflix_db",
					port: parseInt(process.env.DB_PORT || "3306", 10),
					ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
					waitForConnections: true,
					connectionLimit: 10,
					queueLimit: 0,
				});
			}

			const conn = await mysqlPool.getConnection();
			await conn.query(`
				CREATE TABLE IF NOT EXISTS users (
					id INT AUTO_INCREMENT PRIMARY KEY,
					username VARCHAR(255) NOT NULL,
					email VARCHAR(255) NOT NULL UNIQUE,
					password VARCHAR(255) NOT NULL,
					avatar_color VARCHAR(50) DEFAULT '#e50914',
					avatar_image LONGTEXT,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
			`);
			await conn.query(`
				CREATE TABLE IF NOT EXISTS watchlist (
					id INT AUTO_INCREMENT PRIMARY KEY,
					user_id INT NOT NULL,
					movie_id VARCHAR(100) NOT NULL,
					title VARCHAR(255) NOT NULL,
					poster_path TEXT,
					backdrop_path TEXT,
					overview TEXT,
					media_type VARCHAR(50) DEFAULT 'movie',
					vote_average DECIMAL(3,1) DEFAULT 0,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
			`);
			conn.release();
			useMysql = true;
			console.log("✓ Dynamic MySQL connection established");
			return mysqlPool;
		} catch (err) {
			useMysql = false;
			console.log("MySQL connection fallback to dynamic file storage:", err.message);
		}
	}
	return null;
}

// Initialize MySQL check in background
getMysqlPool().catch(() => {});

// Dynamic Password Hashing & Verification
export function hashPassword(password, salt = "netflix_dynamic_salt_2026") {
	return crypto.pbkdf2Sync(password, salt, 1000, 32, "sha256").toString("hex");
}

export function verifyPassword(password, storedHash, salt = "netflix_dynamic_salt_2026") {
	if (!storedHash) return false;
	// Direct bcrypt hash check if legacy
	if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
		try {
			// Compare using pbkdf2 or plain if bcrypt not loaded
			return false;
		} catch {
			return false;
		}
	}
	return hashPassword(password, salt) === storedHash;
}

// Dynamic User Database Operations
export async function findUserByEmail(email) {
	if (!email) return null;
	const clean = email.toLowerCase().trim();

	const pool = await getMysqlPool();
	if (pool && useMysql) {
		try {
			const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [clean]);
			if (rows && rows.length > 0) {
				return {
					id: rows[0].id,
					username: rows[0].username,
					email: rows[0].email,
					passwordHash: rows[0].password,
					avatar_color: rows[0].avatar_color || "#e50914",
					avatarColor: rows[0].avatar_color || "#e50914",
					avatar_image: rows[0].avatar_image || null,
					avatarImage: rows[0].avatar_image || null,
					created_at: rows[0].created_at,
				};
			}
		} catch (err) {
			console.error("MySQL findUserByEmail error:", err.message);
		}
	}

	return db.users.find((u) => u.email.toLowerCase() === clean) || null;
}

export async function createUser(username, email, password, avatarColor = "#e50914") {
	const cleanEmail = email.toLowerCase().trim();
	const cleanUsername = (username || cleanEmail.split("@")[0] || "User").trim();
	const hashedPassword = hashPassword(password);

	const pool = await getMysqlPool();
	if (pool && useMysql) {
		try {
			const [result] = await pool.query(
				"INSERT INTO users (username, email, password, avatar_color) VALUES (?, ?, ?, ?)",
				[cleanUsername, cleanEmail, hashedPassword, avatarColor]
			);
			return {
				id: result.insertId,
				username: cleanUsername,
				email: cleanEmail,
				passwordHash: hashedPassword,
				avatar_color: avatarColor,
				avatarColor: avatarColor,
				avatar_image: null,
				avatarImage: null,
				created_at: new Date().toISOString(),
			};
		} catch (err) {
			console.error("MySQL createUser error, falling back to dynamic store:", err.message);
		}
	}

	const maxId = db.users.length > 0 ? Math.max(...db.users.map((u) => u.id || 0)) : 0;
	const newUser = {
		id: maxId + 1,
		username: cleanUsername,
		email: cleanEmail,
		passwordHash: hashedPassword,
		avatar_color: avatarColor,
		avatarColor: avatarColor,
		avatar_image: null,
		avatarImage: null,
		created_at: new Date().toISOString(),
	};
	db.users.push(newUser);
	saveDb();
	return newUser;
}

export async function updateUser(userId, updates = {}) {
	const pool = await getMysqlPool();
	if (pool && useMysql) {
		try {
			const setCols = [];
			const values = [];
			if (updates.username) { setCols.push("username = ?"); values.push(updates.username); }
			if (updates.email) { setCols.push("email = ?"); values.push(updates.email.toLowerCase().trim()); }
			if (updates.avatarColor) { setCols.push("avatar_color = ?"); values.push(updates.avatarColor); }
			if (updates.avatarImage !== undefined) { setCols.push("avatar_image = ?"); values.push(updates.avatarImage); }
			if (updates.password) { setCols.push("password = ?"); values.push(hashPassword(updates.password)); }

			if (setCols.length > 0) {
				values.push(userId);
				await pool.query(`UPDATE users SET ${setCols.join(", ")} WHERE id = ?`, values);
			}
		} catch (err) {
			console.error("MySQL updateUser error:", err.message);
		}
	}

	const idx = db.users.findIndex((u) => u.id === Number(userId));
	if (idx >= 0) {
		db.users[idx] = {
			...db.users[idx],
			...updates,
			passwordHash: updates.password ? hashPassword(updates.password) : db.users[idx].passwordHash,
		};
		saveDb();
		return db.users[idx];
	}
	return null;
}

// Dynamic Watchlist Database Operations
export async function getWatchlist(userId) {
	const pool = await getMysqlPool();
	if (pool && useMysql) {
		try {
			const [rows] = await pool.query(
				"SELECT * FROM watchlist WHERE user_id = ? ORDER BY id DESC",
				[userId]
			);
			return rows || [];
		} catch (err) {
			console.error("MySQL getWatchlist error:", err.message);
		}
	}
	return db.watchlist.filter((w) => w.user_id === Number(userId));
}

export async function addToWatchlist(userId, item) {
	const pool = await getMysqlPool();
	if (pool && useMysql) {
		try {
			const [existing] = await pool.query(
				"SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ? LIMIT 1",
				[userId, String(item.movieId)]
			);
			if (existing && existing.length > 0) return true;

			await pool.query(
				`INSERT INTO watchlist (user_id, movie_id, title, poster_path, backdrop_path, overview, media_type, vote_average)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					userId,
					String(item.movieId),
					item.title,
					item.posterPath || "",
					item.backdropPath || "",
					item.overview || "",
					item.mediaType || "movie",
					item.voteAverage || 0,
				]
			);
			return true;
		} catch (err) {
			console.error("MySQL addToWatchlist error:", err.message);
		}
	}

	const exists = db.watchlist.some(
		(w) => w.user_id === Number(userId) && String(w.movie_id) === String(item.movieId)
	);
	if (!exists) {
		db.watchlist.push({
			id: db.watchlist.length + 1,
			user_id: Number(userId),
			movie_id: String(item.movieId),
			title: item.title,
			poster_path: item.posterPath || "",
			backdrop_path: item.backdropPath || "",
			overview: item.overview || "",
			media_type: item.mediaType || "movie",
			vote_average: item.voteAverage || 0,
			created_at: new Date().toISOString(),
		});
		saveDb();
	}
	return true;
}

export async function removeFromWatchlist(userId, movieId) {
	const pool = await getMysqlPool();
	if (pool && useMysql) {
		try {
			await pool.query("DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?", [
				userId,
				String(movieId),
			]);
			return true;
		} catch (err) {
			console.error("MySQL removeFromWatchlist error:", err.message);
		}
	}

	db.watchlist = db.watchlist.filter(
		(w) => !(w.user_id === Number(userId) && String(w.movie_id) === String(movieId))
	);
	saveDb();
	return true;
}

// JWT Token Utilities
function base64UrlEncode(str) {
	return Buffer.from(str)
		.toString("base64")
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
}

function base64UrlDecode(str) {
	let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
	while (b64.length % 4) b64 += "=";
	return Buffer.from(b64, "base64").toString("utf-8");
}

export function createJwt(user) {
	const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const payload = base64UrlEncode(
		JSON.stringify({
			id: user.id,
			email: user.email,
			username: user.username,
			iat: Math.floor(Date.now() / 1000),
		})
	);
	const signature = crypto
		.createHmac("sha256", JWT_SECRET)
		.update(`${header}.${payload}`)
		.digest("base64")
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");

	return `${header}.${payload}.${signature}`;
}

export function verifyJwt(token) {
	try {
		if (!token) return null;
		const parts = token.split(".");
		if (parts.length !== 3) return null;
		const [header, payload, signature] = parts;
		const expectedSignature = crypto
			.createHmac("sha256", JWT_SECRET)
			.update(`${header}.${payload}`)
			.digest("base64")
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
		if (signature !== expectedSignature) return null;
		return JSON.parse(base64UrlDecode(payload));
	} catch {
		return null;
	}
}

// Request & Response Helpers
export function parseBody(req) {
	return new Promise((resolve) => {
		if (req.body && typeof req.body === "object") {
			return resolve(req.body);
		}
		if (typeof req.on !== "function") {
			return resolve(req.body || {});
		}
		let data = "";
		req.on("data", (chunk) => {
			data += chunk;
		});
		req.on("end", () => {
			try {
				resolve(data ? JSON.parse(data) : {});
			} catch {
				resolve({});
			}
		});
	});
}

export function cors(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	res.setHeader("Content-Type", "application/json");

	if (req.method === "OPTIONS") {
		res.statusCode = 204;
		res.end();
		return true;
	}
	return false;
}

export function sendJson(res, statusCode, data) {
	res.statusCode = statusCode;
	res.end(JSON.stringify(data));
}
