import React, { useEffect, useState } from "react";
import movieInstance from "../../Utility/MovieInstance";
import requests, { TMDB_POSTER_BASE, TMDB_THUMBNAIL_BASE } from "../../Utility/requestUrls";
import { fallbackMovies } from "../../Data/Data";
import { useMovie } from "../../context/MovieContext";
import { Play, Plus, Check, Info, Globe } from "lucide-react";
import styles from "./BrowseByLanguage.module.css";

const LANGUAGES = [
	{ code: "en", name: "English" },
	{ code: "es", name: "Spanish (Español)" },
	{ code: "ko", name: "Korean (한국어)" },
	{ code: "ja", name: "Japanese (日本語)" },
	{ code: "hi", name: "Hindi (हिन्दी)" },
	{ code: "fr", name: "French (Français)" },
	{ code: "de", name: "German (Deutsch)" },
	{ code: "it", name: "Italian (Italiano)" },
	{ code: "tr", name: "Turkish (Türkçe)" },
];

function BrowseByLanguage() {
	const { playTrailer, openDetail, toggleMyList, isInMyList } = useMovie();
	const [selectedLanguage, setSelectedLanguage] = useState("ko");
	const [preference, setPreference] = useState("original");
	const [sortBy, setSortBy] = useState("popularity");
	const [movies, setMovies] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		let isMounted = true;
		async function fetchLanguageMovies() {
			setIsLoading(true);
			try {
				const res = await movieInstance.get(requests.languageUrl(selectedLanguage));
				if (isMounted) {
					const results = (res.data?.results || []).filter(
						(m) => m.poster_path || m.backdrop_path
					);
					setMovies(results.length > 0 ? results : fallbackMovies);
				}
			} catch (err) {
				console.log("Error loading language movies:", err);
				if (isMounted) {
					setMovies(fallbackMovies);
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		}

		fetchLanguageMovies();

		return () => {
			isMounted = false;
		};
	}, [selectedLanguage]);

	// Sorting
	const sortedMovies = [...movies].sort((a, b) => {
		if (sortBy === "year") {
			const yearA = (a.release_date || a.first_air_date || "").substring(0, 4);
			const yearB = (b.release_date || b.first_air_date || "").substring(0, 4);
			return yearB.localeCompare(yearA);
		}
		if (sortBy === "title") {
			const titleA = (a.title || a.name || "").toLowerCase();
			const titleB = (b.title || b.name || "").toLowerCase();
			return titleA.localeCompare(titleB);
		}
		return 0; // default popularity
	});

	return (
		<div className={styles.languageContainer}>
			<div className={styles.header}>
				<div className={styles.titleWrap}>
					<Globe size={28} color="#e50914" />
					<h1 className={styles.title}>Browse by Language</h1>
				</div>

				{/* Filter Selectors Bar */}
				<div className={styles.filterControls}>
					{/* Preference Selector */}
					<div className={styles.selectGroup}>
						<label htmlFor="pref-select">Select Your Preferences</label>
						<select
							id="pref-select"
							value={preference}
							onChange={(e) => setPreference(e.target.value)}
							className={styles.selectInput}>
							<option value="original">Original Language</option>
							<option value="dubbing">Dubbing</option>
							<option value="subtitles">Subtitles</option>
						</select>
					</div>

					{/* Language Selector */}
					<div className={styles.selectGroup}>
						<label htmlFor="lang-select">Language</label>
						<select
							id="lang-select"
							value={selectedLanguage}
							onChange={(e) => setSelectedLanguage(e.target.value)}
							className={styles.selectInput}>
							{LANGUAGES.map((lang) => (
								<option key={lang.code} value={lang.code}>
									{lang.name}
								</option>
							))}
						</select>
					</div>

					{/* Sort By */}
					<div className={styles.selectGroup}>
						<label htmlFor="sort-select">Sort by</label>
						<select
							id="sort-select"
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className={styles.selectInput}>
							<option value="popularity">Suggestions for you</option>
							<option value="year">Year Released</option>
							<option value="title">A-Z</option>
						</select>
					</div>
				</div>
			</div>

			{/* Movie Grid */}
			{isLoading ? (
				<div className={styles.loadingState}>
					<div className={styles.spinner}></div>
					<p>Finding titles in {LANGUAGES.find((l) => l.code === selectedLanguage)?.name}...</p>
				</div>
			) : (
				<div className={styles.movieGrid}>
					{sortedMovies.map((movie) => {
						const title = movie.title || movie.name || "Title";
						const inList = isInMyList(movie.id);
						const imageSrc =
							movie.localBackdrop ||
							movie.localPoster ||
							(movie.backdrop_path
								? movie.backdrop_path.startsWith("http")
									? movie.backdrop_path
									: `${TMDB_THUMBNAIL_BASE}${movie.backdrop_path}`
								: movie.poster_path?.startsWith("http")
								? movie.poster_path
								: `${TMDB_POSTER_BASE}${movie.poster_path}`);

						const releaseYear = (
							movie.release_date ||
							movie.first_air_date ||
							"2024"
						).substring(0, 4);

						return (
							<div key={movie.id} className={styles.movieCard}>
								<div
									className={styles.imageWrap}
									onClick={() => openDetail(movie)}>
									<img
										src={imageSrc}
										alt={title}
										loading="lazy"
										onError={(e) => {
											e.currentTarget.onerror = null;
											e.currentTarget.src = fallbackMovies[0].localBackdrop;
										}}
									/>
									<div className={styles.hoverOverlay}>
										<div className={styles.overlayButtons}>
											<button
												className={styles.overlayPlayBtn}
												onClick={(e) => {
													e.stopPropagation();
													playTrailer(movie);
												}}
												title="Play Trailer">
												<Play size={16} fill="#000" />
											</button>
											<button
												className={`${styles.overlayIconBtn} ${
													inList ? styles.overlayActiveIcon : ""
												}`}
												onClick={(e) => {
													e.stopPropagation();
													toggleMyList(movie);
												}}
												title={inList ? "Remove from My List" : "Add to My List"}>
												{inList ? <Check size={16} /> : <Plus size={16} />}
											</button>
											<button
												className={styles.overlayIconBtn}
												onClick={(e) => {
													e.stopPropagation();
													openDetail(movie);
												}}
												title="More Info">
												<Info size={16} />
											</button>
										</div>
									</div>
								</div>

								<div className={styles.cardDetails}>
									<h4 className={styles.cardTitle}>{title}</h4>
									<div className={styles.metaRow}>
										<span className={styles.matchScore}>
											{movie.matchScore ||
												`${Math.round((movie.vote_average || 8.2) * 10)}% Match`}
										</span>
										<span className={styles.year}>{releaseYear}</span>
										<span className={styles.badge}>
											{movie.original_language?.toUpperCase() || "INTL"}
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

export default BrowseByLanguage;
