const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "netflix_jwt_secret_key_2026_super_secure";

function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({
			success: false,
			message: "Access denied. No valid authentication token provided.",
		});
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded;
		next();
	} catch (err) {
		return res.status(401).json({
			success: false,
			message: "Invalid or expired session token. Please sign in again.",
			error: err.message,
		});
	}
}

function optionalAuthMiddleware(req, res, next) {
	const authHeader = req.headers.authorization;

	if (authHeader && authHeader.startsWith("Bearer ")) {
		const token = authHeader.split(" ")[1];
		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			req.user = decoded;
		} catch {
			// Optional auth: continue even if token is invalid
		}
	}
	next();
}

module.exports = {
	authMiddleware,
	optionalAuthMiddleware,
};
