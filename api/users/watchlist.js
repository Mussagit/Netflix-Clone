import { sendJson, cors, parseBody, getWatchlist, addToWatchlist, removeFromWatchlist, verifyJwt } from "../_db.js";

export default async function handler(req, res) {
	if (cors(req, res)) return;

	const authHeader = req.headers.authorization || "";
	const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
	const decoded = verifyJwt(token);
	const userId = decoded ? decoded.id : 1;

	if (req.method === "GET") {
		const userList = await getWatchlist(userId);
		return sendJson(res, 200, { success: true, count: userList.length, watchlist: userList });
	}

	if (req.method === "POST") {
		const body = await parseBody(req);
		const { movieId, title, posterPath, backdropPath, overview, mediaType, voteAverage } = body;

		if (!movieId || !title) {
			return sendJson(res, 400, { success: false, message: "movieId and title are required." });
		}

		await addToWatchlist(userId, {
			movieId,
			title,
			posterPath,
			backdropPath,
			overview,
			mediaType,
			voteAverage,
		});

		return sendJson(res, 200, { success: true, message: `Added "${title}" to your watchlist.` });
	}

	if (req.method === "DELETE") {
		const urlParts = req.url.split("/");
		const movieId = urlParts.pop();
		await removeFromWatchlist(userId, movieId);
		return sendJson(res, 200, { success: true, message: "Item removed from watchlist." });
	}

	return sendJson(res, 405, { success: false, message: "Method not allowed" });
}
