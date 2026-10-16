import { findUserByEmail, createJwt, verifyJwt, sendJson, cors, parseBody, saveDb, getDb } from "../_db.js";

export default async function handler(req, res) {
	if (cors(req, res)) return;

	const authHeader = req.headers.authorization || "";
	const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
	const decoded = verifyJwt(token);

	if (req.method === "GET") {
		const db = getDb();
		const user = (decoded ? db.users.find((u) => u.id === decoded.id) : null) || db.users[0];
		return sendJson(res, 200, { success: true, user });
	}

	if (req.method === "PUT" || req.method === "PATCH") {
		const body = await parseBody(req);
		const db = getDb();
		const user = (decoded ? db.users.find((u) => u.id === decoded.id) : null) || db.users[0];

		if (body.username) user.username = body.username.trim();
		if (body.email) user.email = body.email.toLowerCase().trim();
		if (body.avatarColor) user.avatar_color = body.avatarColor;
		if (body.avatarImage !== undefined) user.avatar_image = body.avatarImage;

		saveDb();
		const newToken = createJwt(user);
		return sendJson(res, 200, {
			success: true,
			message: "Profile updated successfully.",
			token: newToken,
			user,
		});
	}

	return sendJson(res, 405, { success: false, message: "Method not allowed" });
}
