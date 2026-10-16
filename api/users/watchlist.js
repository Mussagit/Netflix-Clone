import { sendJson, cors, parseBody, getDb, saveDb, verifyJwt } from "../_db.js";

export default async function handler(req, res) {
	if (cors(req, res)) return;

	const authHeader = req.headers.authorization || "";
	const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
	const decoded = verifyJwt(token);
	const userId = decoded ? decoded.id : 1;
	const db = getDb();

	if (req.method === "GET") {
		const userList = db.watchlist.filter((w) => w.user_id === userId);
		return sendJson(res, 200, { success: true, count: userList.length, watchlist: userList });
	}

	if (req.method === "POST") {
		const body = await parseBody(req);
		const { movieId, title, posterPath, backdropPath, overview, mediaType, voteAverage } = body;

		if (!movieId || !title) {
			return sendJson(res, 400, { success: false, message: "movieId and title are required." });
		}

		const exists = db.watchlist.some((w) => w.user_id === userId && String(w.movie_id) === String(movieId));
		if (!exists) {
			db.watchlist.push({
				id: db.watchlist.length + 1,
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
			saveDb();
		}
		return sendJson(res, 200, { success: true, message: `Added "${title}" to your watchlist.` });
	}

	if (req.method === "DELETE") {
		const urlParts = req.url.split("/");
		const movieId = urlParts.pop();
		db.watchlist = db.watchlist.filter((w) => !(w.user_id === userId && String(w.movie_id) === String(movieId)));
		saveDb();
		return sendJson(res, 200, { success: true, message: "Item removed from watchlist." });
	}

	return sendJson(res, 405, { success: false, message: "Method not allowed" });
}
