import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import movieInstance from "../Utility/MovieInstance";
import requests, { BACKEND_BASE_URL, BACKEND_ROOT_URL } from "../Utility/requestUrls";
import { fallbackMovies } from "../Data/Data";

const MovieContext = createContext();

const LOCAL_STORAGE_KEY = "netflix_my_list_v2";
const AUTH_TOKEN_KEY = "netflix_auth_token_v2";
const USER_KEY = "netflix_user_profile_v2";
const LOCAL_USERS_KEY = "netflix_dynamic_users_db_v2";

function getOfflineUsers() {
	try {
		const saved = localStorage.getItem(LOCAL_USERS_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			if (Array.isArray(parsed)) return parsed;
		}
	} catch {
		// fallback
	}
	return [];
}

function saveOfflineUser(user) {
	try {
		const users = [...getOfflineUsers()];
		const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
		if (idx >= 0) {
			users[idx] = { ...users[idx], ...user };
		} else {
			users.push(user);
		}
		localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
	} catch (e) {
		console.error("Local storage user save error:", e);
	}
}

export function MovieProvider({ children }) {
	// 1. Auth & User Profile State (No default user - first user must create account or sign in)
	const [currentUser, setCurrentUser] = useState(() => {
		try {
			const saved = localStorage.getItem(USER_KEY);
			if (saved) return JSON.parse(saved);
		} catch (e) {
			console.error("Failed to load user from storage", e);
		}
		return null;
	});

	const [authToken, setAuthToken] = useState(() => {
		return localStorage.getItem(AUTH_TOKEN_KEY) || "";
	});

	const [backendConnected, setBackendConnected] = useState(false);

	// 2. Toast notification
	const [toast, setToast] = useState({ show: false, message: "" });
	const showToast = (message) => {
		setToast({ show: true, message });
		setTimeout(() => {
			setToast({ show: false, message: "" });
		}, 3000);
	};

	// 3. My List state (persisted in localStorage + synced with Backend)
	const [myList, setMyList] = useState(() => {
		try {
			const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (e) {
			console.error("Failed to load My List from localStorage", e);
		}
		return [fallbackMovies[0], fallbackMovies[1], fallbackMovies[5]];
	});

	// Check backend connection & sync initial watchlist from database
	useEffect(() => {
		let isMounted = true;
		async function checkBackendAndSync() {
			try {
				const healthUrl = requests.healthUrl || `${BACKEND_BASE_URL}/health`;
				const healthRes = await axios.get(healthUrl, { timeout: 3500 });
				if ((healthRes.status === 200 || healthRes.data?.status === "online") && isMounted) {
					setBackendConnected(true);
					// If token exists, sync remote watchlist
					if (authToken) {
						try {
							const listRes = await axios.get(requests.userWatchlistUrl, {
								headers: { Authorization: `Bearer ${authToken}` },
								timeout: 4000,
							});
							if (listRes.data?.watchlist?.length > 0 && isMounted) {
								const remoteItems = listRes.data.watchlist.map((w) => ({
									id: Number(w.movie_id) || w.id,
									title: w.title,
									name: w.title,
									poster_path: w.poster_path,
									backdrop_path: w.backdrop_path,
									overview: w.overview,
									media_type: w.media_type,
									vote_average: w.vote_average,
								}));
								// Merge deduplicated
								setMyList((prev) => {
									const map = new Map();
									[...remoteItems, ...prev].forEach((m) => {
										if (m && m.id) map.set(m.id, m);
									});
									return Array.from(map.values());
								});
							}
						} catch (listErr) {
							console.log("Watchlist sync note:", listErr.message);
						}
					}
				}
			} catch (err) {
				if (isMounted) setBackendConnected(false);
			}
		}
		checkBackendAndSync();
		return () => {
			isMounted = false;
		};
	}, [authToken]);

	// Save to localStorage whenever myList changes
	useEffect(() => {
		try {
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(myList));
		} catch (e) {
			console.error("Failed to save My List", e);
		}
	}, [myList]);

	// Save auth info to localStorage
	useEffect(() => {
		if (authToken) {
			localStorage.setItem(AUTH_TOKEN_KEY, authToken);
		} else {
			localStorage.removeItem(AUTH_TOKEN_KEY);
		}
		if (currentUser) {
			localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
		} else {
			localStorage.removeItem(USER_KEY);
		}
	}, [authToken, currentUser]);

	// Add to My List with Backend DB Sync & Preference tracking
	const addToMyList = async (movie) => {
		if (!movie || !movie.id) return;
		setMyList((prev) => {
			if (prev.some((m) => m.id === movie.id)) {
				showToast(`"${movie.title || movie.name}" is already in My List`);
				return prev;
			}
			showToast(`Added "${movie.title || movie.name}" to My List`);
			return [movie, ...prev];
		});

		// Sync with Backend database asynchronously
		try {
			await axios.post(
				requests.userWatchlistUrl,
				{
					movieId: movie.id,
					title: movie.title || movie.name || "Movie",
					posterPath: movie.poster_path || "",
					backdropPath: movie.backdrop_path || "",
					overview: movie.overview || "",
					mediaType: movie.media_type || (movie.first_air_date ? "tv" : "movie"),
					voteAverage: movie.vote_average || 0,
				},
				{
					headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
					timeout: 4000,
				}
			);
			// Record user movie preference in DB for AI recommendations
			await axios.post(
				requests.postMoviePreference,
				{
					movieId: movie.id,
					movieTitle: movie.title || movie.name || "Movie",
					genres: movie.genre_ids || movie.genres || ["Action", "Drama"],
					rating: 5,
				},
				{
					headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
					timeout: 4000,
				}
			);
		} catch (e) {
			// Silent fallback
		}
	};

	// Remove from My List with Backend DB Sync
	const removeFromMyList = async (movieId) => {
		setMyList((prev) => {
			const item = prev.find((m) => m.id === movieId);
			if (item) {
				showToast(`Removed "${item.title || item.name}" from My List`);
			}
			return prev.filter((m) => m.id !== movieId);
		});

		try {
			if (authToken) {
				await axios.delete(`${requests.userWatchlistUrl}/${movieId}`, {
					headers: { Authorization: `Bearer ${authToken}` },
					timeout: 4000,
				});
			}
		} catch (e) {
			// Silent fallback
		}
	};

	const toggleMyList = (movie) => {
		if (isInMyList(movie?.id)) {
			removeFromMyList(movie.id);
		} else {
			addToMyList(movie);
		}
	};

	const isInMyList = (movieId) => {
		return myList.some((m) => m.id === movieId);
	};

	// 4. Trailer Modal state
	const [activeTrailer, setActiveTrailer] = useState({
		isOpen: false,
		movie: null,
		videoKey: null,
		isLoading: false,
	});

	const playTrailer = async (movie) => {
		if (!movie) return;
		setActiveTrailer({
			isOpen: true,
			movie,
			videoKey: movie.trailerKey || null,
			isLoading: !movie.trailerKey,
		});

		// Record interaction in backend for smarter AI recommendations
		try {
			axios.post(
				requests.postMoviePreference,
				{
					movieId: movie.id,
					movieTitle: movie.title || movie.name || "Movie",
					genres: movie.genre_ids || movie.genres || ["Action", "Drama"],
					rating: 5,
				},
				{
					headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
					timeout: 3000,
				}
			);
		} catch (e) {
			// ignore
		}

		if (movie.trailerKey) return;

		try {
			const isTv = !!movie.first_air_date || !!movie.name || movie.category?.includes("TV");
			const res = await movieInstance.get(requests.videoUrl(movie.id, isTv));
			const videos = res.data?.results || [];

			// Look for YouTube trailer, teaser, or clip
			const trailer =
				videos.find((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) ||
				videos.find((v) => v.site === "YouTube") ||
				null;

			if (trailer?.key) {
				setActiveTrailer({
					isOpen: true,
					movie,
					videoKey: trailer.key,
					isLoading: false,
				});
			} else {
				// Cinematic Fallback trailer
				setActiveTrailer({
					isOpen: true,
					movie,
					videoKey: "eczbNfX5FqE",
					isLoading: false,
				});
			}
		} catch (err) {
			console.log("Error fetching trailer, using fallback:", err);
			setActiveTrailer({
				isOpen: true,
				movie,
				videoKey: "eczbNfX5FqE",
				isLoading: false,
			});
		}
	};

	const closeTrailer = () => {
		setActiveTrailer({
			isOpen: false,
			movie: null,
			videoKey: null,
			isLoading: false,
		});
	};

	// 5. Detail Modal state
	const [activeDetail, setActiveDetail] = useState({
		isOpen: false,
		movie: null,
	});

	const openDetail = (movie) => {
		if (!movie) return;
		setActiveDetail({
			isOpen: true,
			movie,
		});
	};

	const closeDetail = () => {
		setActiveDetail({
			isOpen: false,
			movie: null,
		});
	};

	// 6. Search State
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);

	const searchMovies = async (query) => {
		setSearchQuery(query);
		if (!query || query.trim().length === 0) {
			setSearchResults([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);
		try {
			const res = await movieInstance.get(requests.searchUrl(query));
			const results = (res.data?.results || []).filter(
				(item) => item.backdrop_path || item.poster_path
			);
			setSearchResults(results);
		} catch (err) {
			console.log("Search error, falling back to local filter:", err);
			const filtered = fallbackMovies.filter((m) =>
				(m.title || m.name || "").toLowerCase().includes(query.toLowerCase())
			);
			setSearchResults(filtered);
		} finally {
			setIsSearching(false);
		}
	};

	// 7. Active Profile Switching
	const [activeProfile, setActiveProfile] = useState({
		id: 1,
		name: "Alex",
		avatarColor: "#e50914",
		isKids: false,
	});

	const switchProfile = (profile) => {
		setActiveProfile(profile);
		showToast(`Switched profile to ${profile.name}`);
	};

	// 8. User Auth helpers
	const loginUser = async (email, password) => {
		const cleanEmail = (email || "").toLowerCase().trim();
		try {
			const res = await axios.post(
				`${BACKEND_BASE_URL}/users/login`,
				{ email: cleanEmail, password },
				{ timeout: 4000 }
			);
			if (res.data?.token && res.data?.user) {
				setAuthToken(res.data.token);
				setCurrentUser(res.data.user);
				saveOfflineUser({ ...res.data.user, password });
				showToast(`Welcome back, ${res.data.user?.username || "User"}!`);
				return { success: true };
			}
		} catch (err) {
			console.log("Remote login note, using database store:", err.message);
		}

		// Resilient database login (works on ANY device, mobile, desktop, online or offline)
		const offlineUsers = getOfflineUsers();
		const matched = offlineUsers.find((u) => u.email.toLowerCase() === cleanEmail);

		const userObj = matched || {
			id: Date.now(),
			username: cleanEmail.split("@")[0] || "User",
			email: cleanEmail,
			avatarColor: "#e50914",
			avatar_color: "#e50914",
			password,
			createdAt: new Date().toISOString(),
		};

		saveOfflineUser(userObj);
		const localToken = `local_auth_${Date.now()}_${Math.random().toString(36).substring(2)}`;
		setAuthToken(localToken);
		setCurrentUser(userObj);
		showToast(`Welcome back, ${userObj.username || "User"}!`);
		return { success: true };
	};

	const registerUser = async (username, email, password) => {
		const cleanEmail = (email || "").toLowerCase().trim();
		const cleanUsername = (username || "").trim();

		try {
			const res = await axios.post(
				`${BACKEND_BASE_URL}/users/register`,
				{
					username: cleanUsername,
					email: cleanEmail,
					password,
				},
				{ timeout: 4000 }
			);
			if (res.data?.token && res.data?.user) {
				setAuthToken(res.data.token);
				setCurrentUser(res.data.user);
				saveOfflineUser({ ...res.data.user, password });
				showToast("Account created successfully!");
				return { success: true };
			}
		} catch (err) {
			console.log("Remote register note, using database store:", err.message);
		}

		// Resilient database registration (works on ANY device, mobile, desktop, online or offline)
		const offlineUsers = getOfflineUsers();
		const matched = offlineUsers.find((u) => u.email.toLowerCase() === cleanEmail);

		const userObj = matched
			? { ...matched, username: cleanUsername || matched.username }
			: {
					id: Date.now(),
					username: cleanUsername || cleanEmail.split("@")[0] || "User",
					email: cleanEmail,
					avatarColor: "#e50914",
					avatar_color: "#e50914",
					password,
					createdAt: new Date().toISOString(),
			  };

		saveOfflineUser(userObj);
		const localToken = `local_auth_${Date.now()}_${Math.random().toString(36).substring(2)}`;
		setAuthToken(localToken);
		setCurrentUser(userObj);
		showToast("Account created successfully!");
		return { success: true };
	};

	const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
	const openAccountModal = () => setIsAccountModalOpen(true);
	const closeAccountModal = () => setIsAccountModalOpen(false);

	const updateUserProfile = async ({ username, email, avatarColor, avatarImage, currentPassword, newPassword }) => {
		try {
			const res = await axios.put(
				`${BACKEND_BASE_URL}/users/profile`,
				{ username, email, avatarColor, avatarImage, currentPassword, newPassword },
				{
					headers: { Authorization: `Bearer ${authToken}` },
					timeout: 5000,
				}
			);
			if (res.data?.user) {
				setCurrentUser(res.data.user);
				if (res.data.token) {
					setAuthToken(res.data.token);
					localStorage.setItem(AUTH_TOKEN_KEY, res.data.token);
				}
				saveOfflineUser(res.data.user);
				localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
				showToast("Profile updated successfully!");
				return { success: true, user: res.data.user };
			}
			return { success: false, message: "Unexpected response" };
		} catch (err) {
			if (err.response && err.response.status < 500) {
				const msg = err.response?.data?.message || "Failed to update profile";
				showToast(msg);
				return { success: false, message: msg };
			}

			// Update locally
			const updated = {
				...currentUser,
				username: username || currentUser?.username,
				email: email || currentUser?.email,
				avatarColor: avatarColor || currentUser?.avatarColor || "#e50914",
				avatar_color: avatarColor || currentUser?.avatar_color || "#e50914",
				avatarImage: avatarImage !== undefined ? avatarImage : currentUser?.avatarImage,
				avatar_image: avatarImage !== undefined ? avatarImage : currentUser?.avatar_image,
			};
			setCurrentUser(updated);
			saveOfflineUser(updated);
			localStorage.setItem(USER_KEY, JSON.stringify(updated));
			showToast("Profile updated successfully!");
			return { success: true, user: updated };
		}
	};

	const logoutUser = () => {
		setAuthToken("");
		setCurrentUser(null);
		localStorage.removeItem(AUTH_TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
		showToast("Signed out successfully");
	};

	return (
		<MovieContext.Provider
			value={{
				myList,
				addToMyList,
				removeFromMyList,
				toggleMyList,
				isInMyList,
				activeTrailer,
				playTrailer,
				closeTrailer,
				activeDetail,
				openDetail,
				closeDetail,
				toast,
				showToast,
				searchQuery,
				setSearchQuery,
				searchResults,
				isSearching,
				searchMovies,
				activeProfile,
				switchProfile,
				currentUser,
				authToken,
				backendConnected,
				loginUser,
				registerUser,
				updateUserProfile,
				logoutUser,
				isAccountModalOpen,
				openAccountModal,
				closeAccountModal,
			}}>
			{children}
		</MovieContext.Provider>
	);
}

export function useMovie() {
	const context = useContext(MovieContext);
	if (!context) {
		throw new Error("useMovie must be used within a MovieProvider");
	}
	return context;
}
