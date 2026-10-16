import { findUserByEmail, updateUser, createJwt, verifyJwt, sendJson, cors, parseBody, getDb } from "../_db.js";

export default async function handler(req, res) {
	if (cors(req, res)) return;

	const authHeader = req.headers.authorization || "";
	const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
	const decoded = verifyJwt(token);

	if (req.method === "GET") {
		const db = getDb();
		const user = (decoded ? db.users.find((u) => u.id === decoded.id) : null) || db.users[0] || {
			id: 1,
			username: "User",
			email: "user@netflix.com",
			avatarColor: "#e50914",
		};
		return sendJson(res, 200, { success: true, user });
	}

	if (req.method === "PUT" || req.method === "PATCH") {
		const body = await parseBody(req);
		const userId = decoded ? decoded.id : (body.id || 1);

		const updatedUser = await updateUser(userId, {
			username: body.username,
			email: body.email,
			avatarColor: body.avatarColor,
			avatarImage: body.avatarImage,
			password: body.newPassword,
		});

		const userObj = updatedUser || {
			id: userId,
			username: body.username || "User",
			email: body.email || "user@netflix.com",
			avatarColor: body.avatarColor || "#e50914",
			avatar_color: body.avatarColor || "#e50914",
		};

		const newToken = createJwt(userObj);
		return sendJson(res, 200, {
			success: true,
			message: "Profile updated successfully.",
			token: newToken,
			user: userObj,
		});
	}

	return sendJson(res, 405, { success: false, message: "Method not allowed" });
}
