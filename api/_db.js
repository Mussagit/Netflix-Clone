// Shared Database and Utilities for Vercel Serverless Functions
import crypto from "crypto";
import fs from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "netflix_jwt_secret_key_2026_super_secure";
const DB_FILE = path.join("/tmp", "netflix.db.json");

// Preloaded with MySQL database accounts
export const initialUsers = [
	{
		id: 1,
		username: "mussa",
		email: "mussa@gmail.com",
		avatar_color: "#e50914",
		avatarColor: "#e50914",
		created_at: new Date().toISOString(),
	},
	{
		id: 2,
		username: "Mussa",
		email: "werku@example.com",
		avatar_color: "#e50914",
		avatarColor: "#e50914",
		created_at: new Date().toISOString(),
	},
	{
		id: 6,
		username: "mussa",
		email: "mussa@example.com",
		avatar_color: "#e50914",
		avatarColor: "#e50914",
		created_at: new Date().toISOString(),
	},
	{
		id: 7,
		username: "mussa",
		email: "mussaa@example.com",
		avatar_color: "#e50914",
		avatarColor: "#e50914",
		created_at: new Date().toISOString(),
	},
];

let db = {
	users: [...initialUsers],
	watchlist: [],
	preferences: [],
};

// Load persistent storage from /tmp if available
try {
	if (fs.existsSync(DB_FILE)) {
		const raw = fs.readFileSync(DB_FILE, "utf-8");
		const parsed = JSON.parse(raw);
		db = { ...db, ...parsed };
		// Ensure initial users exist
		for (const u of initialUsers) {
			if (!db.users.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) {
				db.users.push(u);
			}
		}
	}
} catch (_) {}

export function saveDb() {
	try {
		fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
	} catch (_) {}
}

export function getDb() {
	return db;
}

export function findUserByEmail(email) {
	if (!email) return null;
	const clean = email.toLowerCase().trim();
	return db.users.find((u) => u.email.toLowerCase() === clean) || null;
}

export function createUser(username, email, password) {
	const cleanEmail = email.toLowerCase().trim();
	const existing = findUserByEmail(cleanEmail);
	if (existing) {
		return existing;
	}
	const user = {
		id: db.users.length + 1,
		username: (username || cleanEmail.split("@")[0] || "User").trim(),
		email: cleanEmail,
		avatar_color: "#e50914",
		avatarColor: "#e50914",
		avatar_image: null,
		avatarImage: null,
		created_at: new Date().toISOString(),
	};
	db.users.push(user);
	saveDb();
	return user;
}

// JWT Utilities
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

// Body parsing helper
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

// CORS helper
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
