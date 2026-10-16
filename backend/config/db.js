const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "netflix_db";
const DB_PORT = parseInt(process.env.DB_PORT || "3306", 10);

const isServerless = Boolean(
	process.env.VERCEL ||
	process.env.AWS_LAMBDA_FUNCTION_NAME ||
	process.env.LAMBDA_TASK_ROOT
);

const seedDbFile = path.join(__dirname, "..", "netflix.db.json");
const localDbFile = isServerless ? path.join("/tmp", "netflix.db.json") : seedDbFile;

let mysqlPool = null;
let useMysql = false;

// Fallback dynamic in-memory store persisted to JSON
let localStore = {
	users: [],
	movie_preferences: [],
	watchlist: [],
	ratings: [],
};

// Seed or load local storage
try {
	if (fs.existsSync(localDbFile)) {
		const parsed = JSON.parse(fs.readFileSync(localDbFile, "utf-8"));
		localStore = { ...localStore, ...parsed };
	} else if (fs.existsSync(seedDbFile)) {
		const parsed = JSON.parse(fs.readFileSync(seedDbFile, "utf-8"));
		localStore = { ...localStore, ...parsed };
		if (isServerless) {
			try {
				fs.writeFileSync(localDbFile, JSON.stringify(localStore, null, 2), "utf-8");
			} catch (_) {}
		}
	}
} catch (err) {
	console.log("Local store init note:", err.message);
}

function persistStore() {
	try {
		fs.writeFileSync(localDbFile, JSON.stringify(localStore, null, 2), "utf-8");
	} catch (err) {
		// In strictly read-only environments, keep state in memory without throwing
		console.warn("Storage sync note:", err.message);
	}
}

function executeGenericSql(sql, params = []) {
	const trimmed = sql.trim();
	const firstWord = trimmed.split(/\s+/)[0].toUpperCase();

	// 1. SELECT
	if (firstWord === "SELECT") {
		const matchTable = trimmed.match(/FROM\s+([a-zA-Z0-9_]+)/i);
		const tableName = matchTable ? matchTable[1].toLowerCase() : null;

		if (!tableName || !localStore[tableName]) {
			return [[]];
		}

		let rows = [...localStore[tableName]];

		const whereMatch = trimmed.match(/WHERE\s+([\s\S]+?)(?=(ORDER\s+BY|GROUP\s+BY|LIMIT|$))/i);
		if (whereMatch) {
			const conditionStr = whereMatch[1].trim();
			const conditions = conditionStr.split(/\s+AND\s+/i);
			let paramIdx = 0;

			rows = rows.filter((row) => {
				for (const cond of conditions) {
					const isNotEqual = cond.includes("!=") || cond.includes("<>");
					const separator = isNotEqual ? (cond.includes("!=") ? "!=" : "<>") : "=";
					const parts = cond.split(separator);
					if (parts.length === 2) {
						const col = parts[0].trim().toLowerCase();
						const val = params[paramIdx++];
						if (val !== undefined && val !== null) {
							const matches = String(row[col] ?? "").toLowerCase() === String(val).toLowerCase();
							if (isNotEqual && matches) return false;
							if (!isNotEqual && !matches) return false;
						}
					}
				}
				return true;
			});
		}

		if (/ORDER\s+BY\s+[a-zA-Z0-9_]+\s+DESC/i.test(trimmed)) {
			rows = rows.reverse();
		}

		const limitMatch = trimmed.match(/LIMIT\s+(\d+)/i);
		if (limitMatch) {
			const limitNum = parseInt(limitMatch[1], 10);
			rows = rows.slice(0, limitNum);
		}

		return [rows];
	}

	// 2. INSERT
	if (firstWord === "INSERT") {
		const matchTable = trimmed.match(/INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
		if (matchTable) {
			const tableName = matchTable[1].toLowerCase();
			const columns = matchTable[2].split(",").map((c) => c.trim().toLowerCase());

			if (!localStore[tableName]) {
				localStore[tableName] = [];
			}

			const tableList = localStore[tableName];
			const maxId = tableList.length > 0 ? Math.max(...tableList.map((r) => r.id || 0)) : 0;

			const newRecord = {
				id: maxId + 1,
				created_at: new Date().toISOString(),
			};

			columns.forEach((col, idx) => {
				newRecord[col] = params[idx] !== undefined ? params[idx] : null;
			});

			tableList.push(newRecord);
			persistStore();
			return [{ insertId: newRecord.id, affectedRows: 1 }];
		}
	}

	// 3. UPDATE
	if (firstWord === "UPDATE") {
		const matchTable = trimmed.match(/^UPDATE\s+([a-zA-Z0-9_]+)/i);
		if (matchTable) {
			const tableName = matchTable[1].toLowerCase();
			if (localStore[tableName]) {
				const setMatch = trimmed.match(/SET\s+([\s\S]+?)(?=\s+WHERE|$)/i);
				const whereMatch = trimmed.match(/WHERE\s+([\s\S]+)$/i);

				if (setMatch) {
					const setCols = setMatch[1].split(",").map((s) => {
						const parts = s.split("=");
						return parts[0].trim().toLowerCase();
					});

					const numSetParams = setCols.length;
					const setVals = params.slice(0, numSetParams);
					const whereParams = params.slice(numSetParams);

					let updatedCount = 0;
					let whereConditions = [];
					if (whereMatch) {
						whereConditions = whereMatch[1].trim().split(/\s+AND\s+/i);
					}

					localStore[tableName] = localStore[tableName].map((row) => {
						let matches = true;
						let wIdx = 0;
						for (const cond of whereConditions) {
							const parts = cond.split("=");
							if (parts.length === 2) {
								const col = parts[0].trim().toLowerCase();
								const val = whereParams[wIdx++];
								if (val !== undefined && val !== null) {
									if (String(row[col] ?? "").toLowerCase() !== String(val).toLowerCase()) {
										matches = false;
										break;
									}
								}
							}
						}

						if (matches) {
							updatedCount++;
							const updatedRow = { ...row };
							setCols.forEach((col, idx) => {
								updatedRow[col] = setVals[idx] !== undefined ? setVals[idx] : updatedRow[col];
							});
							return updatedRow;
						}
						return row;
					});

					persistStore();
					return [{ affectedRows: updatedCount }];
				}
			}
		}
	}

	// 4. DELETE
	if (firstWord === "DELETE") {
		const matchTable = trimmed.match(/FROM\s+([a-zA-Z0-9_]+)/i);
		const tableName = matchTable ? matchTable[1].toLowerCase() : null;

		if (tableName && localStore[tableName]) {
			const whereMatch = trimmed.match(/WHERE\s+([\s\S]+)$/i);
			const initialLen = localStore[tableName].length;

			if (whereMatch) {
				const conditionStr = whereMatch[1].trim();
				const conditions = conditionStr.split(/\s+AND\s+/i);
				let paramIdx = 0;

				localStore[tableName] = localStore[tableName].filter((row) => {
					for (const cond of conditions) {
						const parts = cond.split("=");
						if (parts.length === 2) {
							const col = parts[0].trim().toLowerCase();
							const val = params[paramIdx++];
							if (val !== undefined && val !== null) {
								if (String(row[col] ?? "").toLowerCase() === String(val).toLowerCase()) {
									return false;
								}
							}
						}
					}
					return true;
				});
			}

			persistStore();
			return [{ affectedRows: initialLen - localStore[tableName].length }];
		}
	}

	return [{ affectedRows: 0 }];
}

async function initializeDatabase() {
	try {
		const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

		if (connectionUri) {
			mysqlPool = mysql.createPool({
				uri: connectionUri,
				ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
				waitForConnections: true,
				connectionLimit: 10,
				queueLimit: 0,
			});
		} else {
			mysqlPool = mysql.createPool({
				host: DB_HOST,
				user: DB_USER,
				password: DB_PASSWORD,
				database: DB_NAME,
				port: DB_PORT,
				ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
				waitForConnections: true,
				connectionLimit: 10,
				queueLimit: 0,
			});
		}

		const connection = await mysqlPool.getConnection();
		console.log(`✓ MySQL Database connected successfully`);
		useMysql = true;

		// Create tables
		await connection.query(`
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

		try {
			await connection.query("ALTER TABLE users ADD COLUMN avatar_image LONGTEXT;");
		} catch {
			// Column exists
		}

		await connection.query(`
			CREATE TABLE IF NOT EXISTS movie_preferences (
				id INT AUTO_INCREMENT PRIMARY KEY,
				user_id INT NOT NULL,
				movie_id VARCHAR(100) NOT NULL,
				movie_title VARCHAR(255) NOT NULL,
				genres VARCHAR(255) DEFAULT '',
				rating INT DEFAULT 5,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
		`);

		await connection.query(`
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

		connection.release();
	} catch (err) {
		useMysql = false;
		console.log(`ℹ MySQL connection note (${err.message}). Using persistent storage: ${localDbFile}`);
	}
}

initializeDatabase();

const db = {
	query: async (sql, params = []) => {
		if (useMysql && mysqlPool) {
			return await mysqlPool.query(sql, params);
		}
		return executeGenericSql(sql, params);
	},
	pool: mysqlPool,
};

module.exports = db;
