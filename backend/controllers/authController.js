const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "netflix_jwt_secret_key_2026_super_secure";

function generateToken(user) {
	return jwt.sign(
		{ id: user.id, email: user.email, username: user.username },
		JWT_SECRET,
		{ expiresIn: "7d" }
	);
}

/**
 * Register a new user
 * POST /api/users/register
 */
async function register(req, res) {
	try {
		const { username, email, password, avatarColor, avatarImage } = req.body;

		if (!username || !email || !password) {
			return res.status(400).json({
				success: false,
				message: "Please provide username, email, and password.",
			});
		}

		const cleanEmail = email.toLowerCase().trim();
		const cleanUsername = username.trim();

		// Check if user already exists
		const [existingUsers] = await db.query("SELECT * FROM users WHERE email = ?", [cleanEmail]);

		if (existingUsers && existingUsers.length > 0) {
			return res.status(409).json({
				success: false,
				message: "An account with this email address already exists.",
			});
		}

		// Hash password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		const color = avatarColor || "#e50914";
		const img = avatarImage || null;

		// Insert user
		const [result] = await db.query(
			"INSERT INTO users (username, email, password, avatar_color, avatar_image) VALUES (?, ?, ?, ?, ?)",
			[cleanUsername, cleanEmail, hashedPassword, color, img]
		);

		const userId = result.insertId;

		const userObj = {
			id: userId,
			username: cleanUsername,
			email: cleanEmail,
			avatarColor: color,
			avatar_color: color,
			avatarImage: img,
			avatar_image: img,
		};

		const token = generateToken(userObj);

		return res.status(201).json({
			success: true,
			message: "User registered successfully.",
			token,
			user: userObj,
		});
	} catch (error) {
		console.error("Register Error:", error);
		return res.status(500).json({
			success: false,
			message: "Server error occurred during registration.",
			error: error.message,
		});
	}
}

/**
 * Login user
 * POST /api/users/login
 */
async function login(req, res) {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: "Email and password are required.",
			});
		}

		const cleanEmail = email.toLowerCase().trim();

		const [users] = await db.query("SELECT * FROM users WHERE email = ?", [cleanEmail]);

		if (!users || users.length === 0) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password.",
			});
		}

		const user = users[0];

		let isMatch = false;
		if (user.password && (user.password.startsWith("$2a$") || user.password.startsWith("$2b$"))) {
			isMatch = await bcrypt.compare(password, user.password);
		} else {
			isMatch = password === user.password;
		}

		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password.",
			});
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

		const token = generateToken(userObj);

		return res.status(200).json({
			success: true,
			message: "Login successful.",
			token,
			user: userObj,
		});
	} catch (error) {
		console.error("Login Error:", error);
		return res.status(500).json({
			success: false,
			message: "Server error occurred during login.",
			error: error.message,
		});
	}
}

/**
 * Get current profile
 * GET /api/users/profile
 */
async function getProfile(req, res) {
	try {
		const userId = req.user.id;

		const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

		if (!users || users.length === 0) {
			return res.status(404).json({
				success: false,
				message: "User profile not found.",
			});
		}

		const user = users[0];
		const userObj = {
			id: user.id,
			username: user.username,
			email: user.email,
			avatarColor: user.avatar_color || "#e50914",
			avatar_color: user.avatar_color || "#e50914",
			avatarImage: user.avatar_image || null,
			avatar_image: user.avatar_image || null,
			createdAt: user.created_at,
		};

		return res.status(200).json({
			success: true,
			user: userObj,
		});
	} catch (error) {
		console.error("GetProfile Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch user profile.",
			error: error.message,
		});
	}
}

/**
 * Update user profile
 * PUT / PATCH /api/users/profile
 */
async function updateProfile(req, res) {
	try {
		const userId = req.user.id;
		const { username, email, avatarColor, avatarImage, currentPassword, newPassword } = req.body;

		const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
		if (!users || users.length === 0) {
			return res.status(404).json({
				success: false,
				message: "User not found.",
			});
		}

		const currentUser = users[0];
		let updatedUsername = username ? username.trim() : currentUser.username;
		let updatedEmail = email ? email.toLowerCase().trim() : currentUser.email;
		let updatedColor = avatarColor || currentUser.avatar_color || "#e50914";
		let updatedImage = avatarImage !== undefined ? avatarImage : currentUser.avatar_image;
		let updatedPassword = currentUser.password;

		// Password update verification
		if (newPassword) {
			if (!currentPassword) {
				return res.status(400).json({
					success: false,
					message: "Current password is required to set a new password.",
				});
			}

			let isMatch = false;
			if (currentUser.password.startsWith("$2a$") || currentUser.password.startsWith("$2b$")) {
				isMatch = await bcrypt.compare(currentPassword, currentUser.password);
			} else {
				isMatch = currentPassword === currentUser.password;
			}

			if (!isMatch) {
				return res.status(400).json({
					success: false,
					message: "Incorrect current password.",
				});
			}

			const salt = await bcrypt.genSalt(10);
			updatedPassword = await bcrypt.hash(newPassword, salt);
		}

		// Check email uniqueness if email changed
		if (updatedEmail !== currentUser.email) {
			const [existing] = await db.query("SELECT id FROM users WHERE email = ? AND id != ?", [
				updatedEmail,
				userId,
			]);
			if (existing && existing.length > 0) {
				return res.status(409).json({
					success: false,
					message: "That email is already in use by another account.",
				});
			}
		}

		await db.query(
			"UPDATE users SET username = ?, email = ?, password = ?, avatar_color = ?, avatar_image = ? WHERE id = ?",
			[updatedUsername, updatedEmail, updatedPassword, updatedColor, updatedImage, userId]
		);

		const updatedUserObj = {
			id: userId,
			username: updatedUsername,
			email: updatedEmail,
			avatarColor: updatedColor,
			avatar_color: updatedColor,
			avatarImage: updatedImage,
			avatar_image: updatedImage,
		};

		const newToken = generateToken(updatedUserObj);

		return res.status(200).json({
			success: true,
			message: "Profile updated successfully.",
			token: newToken,
			user: updatedUserObj,
		});
	} catch (error) {
		console.error("UpdateProfile Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to update profile.",
			error: error.message,
		});
	}
}

module.exports = {
	register,
	login,
	getProfile,
	updateProfile,
};
