import { findUserByEmail, createUser, createJwt, sendJson, cors, parseBody } from "../_db.js";

export default async function handler(req, res) {
	if (cors(req, res)) return;

	if (req.method !== "POST") {
		return sendJson(res, 405, { success: false, message: "Method not allowed" });
	}

	const body = await parseBody(req);
	const { email, password } = body;

	if (!email || !password) {
		return sendJson(res, 400, {
			success: false,
			message: "Email and password are required.",
		});
	}

	const cleanEmail = email.toLowerCase().trim();
	let user = findUserByEmail(cleanEmail);

	if (!user) {
		user = createUser(cleanEmail.split("@")[0] || "User", cleanEmail, password);
	}

	const token = createJwt(user);
	return sendJson(res, 200, {
		success: true,
		message: "Login successful.",
		token,
		user,
	});
}
