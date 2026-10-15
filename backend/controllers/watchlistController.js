const db = require("../config/db");

/**
 * Get user's personal watchlist
 * GET /api/users/watchlist
 */
async function getWatchlist(req, res) {
	try {
		const userId = req.user.id;

		const [items] = await db.query(
			"SELECT * FROM watchlist WHERE user_id = ? ORDER BY id DESC",
			[userId]
		);

		return res.status(200).json({
			success: true,
			count: items ? items.length : 0,
			watchlist: items || [],
		});
	} catch (error) {
		console.error("GetWatchlist Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to retrieve watchlist.",
			error: error.message,
		});
	}
}

/**
 * Add a title to user's watchlist
 * POST /api/users/watchlist
 */
async function addToWatchlist(req, res) {
	try {
		const userId = req.user.id;
		const {
			movieId,
			title,
			posterPath,
			backdropPath,
			overview,
			mediaType,
			voteAverage,
		} = req.body;

		if (!movieId || !title) {
			return res.status(400).json({
				success: false,
				message: "movieId and title are required to add to watchlist.",
			});
		}

		// Check if already in watchlist for this user
		const [existing] = await db.query(
			"SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?",
			[userId, String(movieId)]
		);

		if (existing && existing.length > 0) {
			return res.status(200).json({
				success: true,
				message: `"${title}" is already in your watchlist.`,
			});
		}

		await db.query(
			`INSERT INTO watchlist (user_id, movie_id, title, poster_path, backdrop_path, overview, media_type, vote_average)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				userId,
				String(movieId),
				title,
				posterPath || "",
				backdropPath || "",
				overview || "",
				mediaType || "movie",
				voteAverage || 0,
			]
		);

		return res.status(201).json({
			success: true,
			message: `Added "${title}" to your watchlist.`,
		});
	} catch (error) {
		console.error("AddToWatchlist Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to add title to watchlist.",
			error: error.message,
		});
	}
}

/**
 * Remove a title from watchlist
 * DELETE /api/users/watchlist/:movieId
 */
async function removeFromWatchlist(req, res) {
	try {
		const userId = req.user.id;
		const { movieId } = req.params;

		if (!movieId) {
			return res.status(400).json({
				success: false,
				message: "movieId is required.",
			});
		}

		const [result] = await db.query(
			"DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?",
			[userId, String(movieId)]
		);

		return res.status(200).json({
			success: true,
			message: "Item removed from watchlist successfully.",
			affectedRows: result ? result.affectedRows : 0,
		});
	} catch (error) {
		console.error("RemoveFromWatchlist Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to remove item from watchlist.",
			error: error.message,
		});
	}
}

module.exports = {
	getWatchlist,
	addToWatchlist,
	removeFromWatchlist,
};
