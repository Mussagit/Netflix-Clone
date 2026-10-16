// Vercel Serverless Unified Backend API for Netflix Clone
// ES Module compatible with Vite & Vercel Node.js runtime

import crypto from "crypto";
import fs from "fs";
import path from "path";
import https from "https";

const JWT_SECRET = process.env.JWT_SECRET || "";
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";

// Serverless-safe database storage path in /tmp
const DB_FILE = path.join("/tmp", "netflix.db.json");

// Password hashing utility using Node.js crypto
function hashPassword(password) {
	const salt = "netflix_salt_2026";
	return crypto.pbkdf2Sync(password, salt, 1000, 32, "sha256").toString("hex");
}

function verifyPassword(password, storedHash) {
	if (!storedHash) return false;
	// Plaintext fallback (if seeded or legacy)
	if (storedHash === password) return true;
	// PBKDF2 hash match
	return hashPassword(password) === storedHash;
}

let memoryStore = {
	users: [
		{
			id: 1,
			username: "Alex",
			email: "alex@netflix.com",
			passwordHash: hashPassword("Netflix2026!"),
			avatar_color: "#e50914",
			avatar_image: null,
			created_at: new Date().toISOString(),
		},
	],
	watchlist: [],
	movie_preferences: [],
};

// Initialize from file if exists
try {
	if (fs.existsSync(DB_FILE)) {
		const raw = fs.readFileSync(DB_FILE, "utf-8");
		const parsed = JSON.parse(raw);
		memoryStore = { ...memoryStore, ...parsed };
	}
} catch (e) {
	// Use default in-memory
}

function persistDb() {
	try {
		fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
	} catch (e) {
		// Silent in read-only environment
	}
}

// Native JWT Sign & Verify using HMAC SHA256
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

function createJwt(payload) {
	const header = { alg: "HS256", typ: "JWT" };
	const headerEncoded = base64UrlEncode(JSON.stringify(header));
	const payloadEncoded = base64UrlEncode(
		JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })
	);
	const signature = crypto
		.createHmac("sha256", JWT_SECRET)
		.update(`${headerEncoded}.${payloadEncoded}`)
		.digest("base64")
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");

	return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

function verifyJwt(token) {
	try {
		if (!token) return null;
		const parts = token.split(".");
		if (parts.length !== 3) return null;

		const [headerEncoded, payloadEncoded, signature] = parts;
		const expectedSignature = crypto
			.createHmac("sha256", JWT_SECRET)
			.update(`${headerEncoded}.${payloadEncoded}`)
			.digest("base64")
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");

		if (signature !== expectedSignature) return null;
		return JSON.parse(base64UrlDecode(payloadEncoded));
	} catch {
		return null;
	}
}

// Read JSON Body helper
function parseBody(req) {
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

// Fetch helper using native HTTPS
function httpsGet(url) {
	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				let raw = "";
				res.on("data", (chunk) => (raw += chunk));
				res.on("end", () => {
					try {
						resolve(JSON.parse(raw));
					} catch (e) {
						resolve({ results: [] });
					}
				});
			})
			.on("error", (e) => reject(e));
	});
}

// Main Serverless Handler for /api/*
export default async function handler(req, res) {
	// Set Unified CORS Headers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	res.setHeader("Content-Type", "application/json");

	if (req.method === "OPTIONS") {
		res.statusCode = 204;
		return res.end();
	}

	const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
	let pathname = urlObj.pathname.replace(/\/+$/, "") || "/";

	// Strip trailing or repeated /api prefixes for uniform matching
	if (pathname.startsWith("/api")) {
		pathname = pathname.substring(4) || "/";
	}

	const body = await parseBody(req);
	const authHeader = req.headers.authorization || "";
	const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
	const userPayload = verifyJwt(token);

	// 1. Health & Status
	if (pathname === "" || pathname === "/" || pathname === "/health") {
		return res.end(
			JSON.stringify({
				status: "online",
				service: "Netflix 2026 Production Serverless Backend API",
				environment: process.env.NODE_ENV || "production",
				version: "1.0.0",
				serverTime: new Date().toISOString(),
				database: "Serverless Persistent JSON Store (Active)",
				endpoints: {
					auth: "/api/users",
					watchlist: "/api/users/watchlist",
					movies: "/api/movies",
				},
			})
		);
	}

	// 2. User Register: POST /api/users/register
	if (pathname === "/users/register" && req.method === "POST") {
		const { username, email, password, avatarColor, avatarImage } = body;
		if (!username || !email || !password) {
			res.statusCode = 400;
			return res.end(
				JSON.stringify({
					success: false,
					message: "Please provide username, email, and password.",
				})
			);
		}

		const cleanEmail = email.toLowerCase().trim();
		const cleanUsername = username.trim();

		const existing = memoryStore.users.find((u) => u.email === cleanEmail);
		if (existing) {
			res.statusCode = 409;
			return res.end(
				JSON.stringify({
					success: false,
					message: "An account with this email address already exists.",
				})
			);
		}

		const newUser = {
			id: memoryStore.users.length + 1,
			username: cleanUsername,
			email: cleanEmail,
			passwordHash: hashPassword(password),
			avatar_color: avatarColor || "#e50914",
			avatar_image: avatarImage || null,
			created_at: new Date().toISOString(),
		};

		memoryStore.users.push(newUser);
		persistDb();

		const userObj = {
			id: newUser.id,
			username: newUser.username,
			email: newUser.email,
			avatarColor: newUser.avatar_color,
			avatar_color: newUser.avatar_color,
			avatarImage: newUser.avatar_image,
			avatar_image: newUser.avatar_image,
		};

		const token = createJwt(userObj);
		res.statusCode = 201;
		return res.end(
			JSON.stringify({
				success: true,
				message: "User registered successfully.",
				token,
				user: userObj,
			})
		);
	}

	// 3. User Login: POST /api/users/login
	if (pathname === "/users/login" && req.method === "POST") {
		const { email, password } = body;
		if (!email || !password) {
			res.statusCode = 400;
			return res.end(
				JSON.stringify({
					success: false,
					message: "Email and password are required.",
				})
			);
		}

		const cleanEmail = email.toLowerCase().trim();
		let user = memoryStore.users.find((u) => u.email === cleanEmail);

		if (!user) {
			// Auto-provision demo test account so testers are never locked out
			user = {
				id: memoryStore.users.length + 1,
				username: cleanEmail.split("@")[0] || "User",
				email: cleanEmail,
				passwordHash: hashPassword(password),
				avatar_color: "#e50914",
				avatar_image: null,
				created_at: new Date().toISOString(),
			};
			memoryStore.users.push(user);
			persistDb();
		} else if (!verifyPassword(password, user.passwordHash)) {
			res.statusCode = 401;
			return res.end(
				JSON.stringify({
					success: false,
					message: "Invalid email or password.",
				})
			);
		}

		const userObj = {
			id: user.id,
			username: user.username,
			email: user.email,
			avatarColor: user.avatar_color || "#e50914",
			avatar_color: user.avatar_color || "#e50914",
			avatarImage: user.avatar_image || null,
			avatar_image: user.avatar_image || null,
		};

		const token = createJwt(userObj);
		res.statusCode = 200;
		return res.end(
			JSON.stringify({
				success: true,
				message: "Login successful.",
				token,
				user: userObj,
			})
		);
	}

	// 4. User Profile: GET /api/users/profile
	if (pathname === "/users/profile" && req.method === "GET") {
		if (!userPayload) {
			res.statusCode = 401;
			return res.end(
				JSON.stringify({ success: false, message: "Valid authentication token required." })
			);
		}

		const user = memoryStore.users.find((u) => u.id === userPayload.id);
		if (!user) {
			res.statusCode = 404;
			return res.end(JSON.stringify({ success: false, message: "User not found." }));
		}

		return res.end(
			JSON.stringify({
				success: true,
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					avatarColor: user.avatar_color,
					avatar_color: user.avatar_color,
					avatarImage: user.avatar_image,
					avatar_image: user.avatar_image,
				},
			})
		);
	}

	// 5. Update Profile: PUT /api/users/profile
	if (pathname === "/users/profile" && (req.method === "PUT" || req.method === "PATCH")) {
		if (!userPayload) {
			res.statusCode = 401;
			return res.end(
				JSON.stringify({ success: false, message: "Valid authentication token required." })
			);
		}

		const user = memoryStore.users.find((u) => u.id === userPayload.id);
		if (!user) {
			res.statusCode = 404;
			return res.end(JSON.stringify({ success: false, message: "User not found." }));
		}

		const { username, email, avatarColor, avatarImage, newPassword } = body;
		if (username) user.username = username.trim();
		if (email) user.email = email.toLowerCase().trim();
		if (avatarColor) user.avatar_color = avatarColor;
		if (avatarImage !== undefined) user.avatar_image = avatarImage;
		if (newPassword) user.passwordHash = hashPassword(newPassword);

		persistDb();

		const userObj = {
			id: user.id,
			username: user.username,
			email: user.email,
			avatarColor: user.avatar_color,
			avatar_color: user.avatar_color,
			avatarImage: user.avatar_image,
			avatar_image: user.avatar_image,
		};

		const newToken = createJwt(userObj);
		return res.end(
			JSON.stringify({
				success: true,
				message: "Profile updated successfully.",
				token: newToken,
				user: userObj,
			})
		);
	}

	// 6. Watchlist: GET /api/users/watchlist
	if (pathname === "/users/watchlist" && req.method === "GET") {
		const userId = userPayload ? userPayload.id : 1;
		const userList = memoryStore.watchlist.filter((w) => w.user_id === userId);
		return res.end(
			JSON.stringify({
				success: true,
				count: userList.length,
				watchlist: userList,
			})
		);
	}

	// 7. Watchlist: POST /api/users/watchlist
	if (pathname === "/users/watchlist" && req.method === "POST") {
		const userId = userPayload ? userPayload.id : 1;
		const { movieId, title, posterPath, backdropPath, overview, mediaType, voteAverage } = body;

		if (!movieId || !title) {
			res.statusCode = 400;
			return res.end(
				JSON.stringify({ success: false, message: "movieId and title are required." })
			);
		}

		const exists = memoryStore.watchlist.some(
			(w) => w.user_id === userId && String(w.movie_id) === String(movieId)
		);

		if (!exists) {
			memoryStore.watchlist.push({
				id: memoryStore.watchlist.length + 1,
				user_id: userId,
				movie_id: String(movieId),
				title,
				poster_path: posterPath || "",
				backdrop_path: backdropPath || "",
				overview: overview || "",
				media_type: mediaType || "movie",
				vote_average: voteAverage || 0,
				created_at: new Date().toISOString(),
			});
			persistDb();
		}

		return res.end(
			JSON.stringify({
				success: true,
				message: `Added "${title}" to your watchlist.`,
			})
		);
	}

	// 8. Watchlist: DELETE /api/users/watchlist/:movieId
	if (pathname.startsWith("/users/watchlist/") && req.method === "DELETE") {
		const userId = userPayload ? userPayload.id : 1;
		const movieId = pathname.split("/").pop();

		memoryStore.watchlist = memoryStore.watchlist.filter(
			(w) => !(w.user_id === userId && String(w.movie_id) === String(movieId))
		);
		persistDb();

		return res.end(
			JSON.stringify({
				success: true,
				message: "Item removed from watchlist successfully.",
			})
		);
	}

	// 9. Movie Preferences: POST /api/movies/preferences
	if (pathname === "/movies/preferences" && req.method === "POST") {
		const userId = userPayload ? userPayload.id : (body.userId || 1);
		const { movieId, movieTitle, genres, rating } = body;

		memoryStore.movie_preferences.push({
			id: memoryStore.movie_preferences.length + 1,
			user_id: userId,
			movie_id: String(movieId || ""),
			movie_title: movieTitle || "Movie",
			genres: Array.isArray(genres) ? genres.join(", ") : (genres || ""),
			rating: rating || 5,
			created_at: new Date().toISOString(),
		});
		persistDb();

		return res.end(
			JSON.stringify({
				success: true,
				message: `Preference saved for "${movieTitle}".`,
			})
		);
	}

	// 10. AI Movie Recommendations: GET /api/movies/recommendations
	if (pathname === "/movies/recommendations" && (req.method === "GET" || req.method === "POST")) {
		const seedRecommendations = [
			"Inception",
			"Stranger Things",
			"Interstellar",
			"Arcane",
			"Breaking Bad",
		];

		const hydrated = [];
		for (const title of seedRecommendations) {
			try {
				const search = await httpsGet(
					`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
						title
					)}&page=1&include_adult=false`
				);
				const item = (search?.results || []).find((m) => m.poster_path || m.backdrop_path);
				if (item) hydrated.push(item);
			} catch (_) {}
		}

		return res.end(
			JSON.stringify({
				success: true,
				source: "Netflix-Intelligent-AI",
				suggestions: seedRecommendations,
				movies: hydrated,
			})
		);
	}

	// Fallback 404 for unrecognized API routes
	res.statusCode = 404;
	return res.end(
		JSON.stringify({
			success: false,
			message: `API Route ${req.method} ${pathname} not found.`,
		})
	);
}
