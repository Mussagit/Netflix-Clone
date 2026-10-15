const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");

const TMDB_API_KEY = process.env.TMDB_API_KEY || "1d81816c92e2a6b1b532b8a8d7c53480";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

/**
 * Save user movie preference
 * POST /api/movies/preferences
 */
async function createMoviePreference(req, res) {
	try {
		const userId = req.user ? req.user.id : req.body.userId;
		const { movieId, movieTitle, genres, rating } = req.body;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Authentication required to save movie preference.",
			});
		}

		if (!movieId || !movieTitle) {
			return res.status(400).json({
				success: false,
				message: "movieId and movieTitle are required.",
			});
		}

		const genresStr = Array.isArray(genres) ? genres.join(", ") : (genres || "");

		await db.query(
			"INSERT INTO movie_preferences (user_id, movie_id, movie_title, genres, rating) VALUES (?, ?, ?, ?, ?)",
			[userId, String(movieId), movieTitle, genresStr, rating || 5]
		);

		return res.status(201).json({
			success: true,
			message: `Preference saved for "${movieTitle}".`,
		});
	} catch (error) {
		console.error("CreateMoviePreference Error:", error);
		return res.status(500).json({
			success: false,
			message: "Server error while saving preference.",
			error: error.message,
		});
	}
}

/**
 * AI-powered movie recommendations with TMDB hydration
 * GET & POST /api/movies/recommendations
 */
async function getRecommendations(req, res) {
	try {
		const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId);

		let preferences = [];
		if (userId) {
			const [prefs] = await db.query(
				"SELECT * FROM movie_preferences WHERE user_id = ? ORDER BY id DESC LIMIT 5",
				[userId]
			);
			preferences = prefs || [];
		}

		let movieTitles = "";
		if (preferences && preferences.length > 0) {
			movieTitles = preferences.map((p) => p.movie_title).join(", ");
		} else {
			movieTitles = "Demon Slayer, Stranger Things, Bridgerton, Interstellar, Breaking Bad";
		}

		let aiSuggestions = [];

		if (GEMINI_API_KEY && !GEMINI_API_KEY.includes("Dummy")) {
			try {
				const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
				const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

				const prompt = `The user recently watched: ${movieTitles}.
Recommend 5 similar movies or TV shows they might like to watch on Netflix.
Requirements:
- Suggest real, commercially released movies or shows.
- Use the exact official English title.
- Return only a valid JSON array of 5 strings.
Example: ["Inception", "The Dark Knight", "Interstellar", "Tenet", "Memento"]`;

				const response = await model.generateContent(prompt);
				const responseText = response.response.text();
				const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
				aiSuggestions = JSON.parse(cleaned);
			} catch (aiErr) {
				console.error("Gemini AI API note:", aiErr.message);
				aiSuggestions = [];
			}
		}

		if (!Array.isArray(aiSuggestions) || aiSuggestions.length === 0) {
			aiSuggestions = [
				"Attack on Titan",
				"Jujutsu Kaisen",
				"Cyberpunk: Edgerunners",
				"Arcane",
				"Dark",
			];
		}

		// Hydrate suggestions with real TMDB metadata
		const hydratedMovies = [];
		for (const title of aiSuggestions) {
			try {
				const tmdbRes = await axios.get(
					`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
						title
					)}&page=1&include_adult=false`,
					{ timeout: 4000 }
				);
				const matched = (tmdbRes.data?.results || []).find(
					(m) => m.poster_path || m.backdrop_path
				);
				if (matched) {
					hydratedMovies.push(matched);
				}
			} catch {
				// skip on failure
			}
		}

		return res.status(200).json({
			success: true,
			source: GEMINI_API_KEY && !GEMINI_API_KEY.includes("Dummy") ? "Gemini-AI" : "Intelligent-Engine",
			seedTitles: movieTitles,
			suggestions: aiSuggestions,
			movies: hydratedMovies,
		});
	} catch (error) {
		console.error("GetRecommendations Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to generate recommendations.",
			error: error.message,
		});
	}
}

/**
 * TMDB Trending proxy
 * GET /api/movies/trending
 */
async function getTrending(req, res) {
	try {
		const response = await axios.get(
			`https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}&language=en-US`,
			{ timeout: 5000 }
		);
		return res.status(200).json(response.data);
	} catch (error) {
		console.error("GetTrending Error:", error.message);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch trending titles.",
			error: error.message,
		});
	}
}

/**
 * TMDB Details proxy
 * GET /api/movies/details/:id
 */
async function getMovieDetails(req, res) {
	try {
		const { id } = req.params;
		const isTv = req.query.isTv === "true";
		const endpoint = `https://api.themoviedb.org/3/${isTv ? "tv" : "movie"}/${id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,similar`;
		const response = await axios.get(endpoint, { timeout: 5000 });
		return res.status(200).json(response.data);
	} catch (error) {
		console.error("GetMovieDetails Error:", error.message);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch movie details.",
			error: error.message,
		});
	}
}

module.exports = {
	createMoviePreference,
	getRecommendations,
	getTrending,
	getMovieDetails,
};
