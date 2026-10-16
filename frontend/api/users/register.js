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
	const existing = findUserByEmail(cleanEmail);

	if (existing) {
		// Existing account: seamlessly authenticate
		const token = createJwt(existing);
		return sendJson(res, 200, {
			success: true,
			message: "Welcome back!",
			token,
			user: existing,
		});
	}

	const user = createUser(username, cleanEmail, password);
	const token = createJwt(user);

	return sendJson(res, 201, {
		success: true,
		message: "User registered successfully.",
		token,
		user,
	});
}
