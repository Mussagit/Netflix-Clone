export const API_KEY =
	import.meta.env.VITE_TMDB_API_KEY ||
	import.meta.env.VITE_API_KEY ||
	"1d81816c92e2a6b1b532b8a8d7c53480";

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/original";
export const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500";
export const TMDB_THUMBNAIL_BASE = "https://image.tmdb.org/t/p/w300";

export const BACKEND_BASE_URL =
	import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const requests = {
	apiKey: API_KEY,
	backendBaseUrl: BACKEND_BASE_URL,
	fetchAiRecommendations: `${BACKEND_BASE_URL}/movies/recommendations`,
	postMoviePreference: `${BACKEND_BASE_URL}/movies/preferences`,
	userWatchlistUrl: `${BACKEND_BASE_URL}/users/watchlist`,
	fetchTrending: `/trending/all/week?api_key=${API_KEY}&language=en-US`,
	fetchNetflixOriginals: `/discover/tv?api_key=${API_KEY}&with_networks=213`,
	fetchTopRatedMovies: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
	fetchActionMovies: `/discover/movie?api_key=${API_KEY}&with_genres=28`,
	fetchComedyMovies: `/discover/movie?api_key=${API_KEY}&with_genres=35`,
	fetchHorrorMovies: `/discover/movie?api_key=${API_KEY}&with_genres=27`,
	fetchRomanceMovies: `/discover/movie?api_key=${API_KEY}&with_genres=10749`,
	fetchDocumentaries: `/discover/movie?api_key=${API_KEY}&with_genres=99`,
	fetchSciFiMovies: `/discover/movie?api_key=${API_KEY}&with_genres=878`,
	fetchAnimationMovies: `/discover/movie?api_key=${API_KEY}&with_genres=16`,

	// TV Shows
	fetchTrendingTv: `/trending/tv/week?api_key=${API_KEY}&language=en-US`,
	fetchTopRatedTv: `/tv/top_rated?api_key=${API_KEY}&language=en-US`,
	fetchPopularTv: `/tv/popular?api_key=${API_KEY}&language=en-US`,
	fetchActionAdventureTv: `/discover/tv?api_key=${API_KEY}&with_genres=10759`,
	fetchComedyTv: `/discover/tv?api_key=${API_KEY}&with_genres=35`,
	fetchDramaTv: `/discover/tv?api_key=${API_KEY}&with_genres=18`,
	fetchSciFiTv: `/discover/tv?api_key=${API_KEY}&with_genres=10765`,

	// New & Popular
	fetchUpcomingMovies: `/movie/upcoming?api_key=${API_KEY}&language=en-US`,
	fetchNowPlayingMovies: `/movie/now_playing?api_key=${API_KEY}&language=en-US`,

	// Helpers
	searchUrl: (query) =>
		`/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`,
	videoUrl: (id, isTv = false) =>
		`/${isTv ? "tv" : "movie"}/${id}/videos?api_key=${API_KEY}&language=en-US`,
	detailsUrl: (id, isTv = false) =>
		`/${isTv ? "tv" : "movie"}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=credits,similar`,
	languageUrl: (lang = "en", page = 1) =>
		`/discover/movie?api_key=${API_KEY}&with_original_language=${lang}&page=${page}&sort_by=popularity.desc`,
};

export default requests;
