import { findUserByEmail, createUser, createJwt, sendJson, cors, parseBody } from "../_db.js";

export default async function handler(req, res) {
	if (cors(req, res)) return;

	if (req.method !== "POST") {
		return sendJson(res, 405, { success: false, message: "Method not allowed" });
	}

	const body = await parseBody(req);
	const { username, email, password } = body;

	if (!email || !password) {
		return sendJson(res, 400, {
			success: false,
			message: "Email and password are required.",
		});
	}

	const cleanEmail = email.toLowerCase().trim();
	const existing = await findUserByEmail(cleanEmail);

	if (existing) {
		// Existing account: authenticate dynamically
		const token = createJwt(existing);
		return sendJson(res, 200, {
			success: true,
			message: "Account already exists. Welcome back!",
			token,
			user: {
				id: existing.id,
				username: existing.username,
				email: existing.email,
				avatarColor: existing.avatar_color || existing.avatarColor || "#e50914",
				avatar_color: existing.avatar_color || existing.avatarColor || "#e50914",
				avatarImage: existing.avatar_image || existing.avatarImage || null,
			},
		});
	}

	const newUser = await createUser(username, cleanEmail, password);
	const token = createJwt(newUser);

	return sendJson(res, 201, {
		success: true,
		message: "User registered successfully.",
		token,
		user: {
			id: newUser.id,
			username: newUser.username,
			email: newUser.email,
			avatarColor: newUser.avatar_color || newUser.avatarColor || "#e50914",
			avatar_color: newUser.avatar_color || newUser.avatarColor || "#e50914",
			avatarImage: newUser.avatar_image || newUser.avatarImage || null,
		},
	});
}
