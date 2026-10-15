import React, { useEffect } from "react";
import axios from "axios";
import { X, Play, Plus, Check, ThumbsUp } from "lucide-react";
import { useMovie } from "../../context/MovieContext";
import requests, { TMDB_IMAGE_BASE, TMDB_POSTER_BASE } from "../../Utility/requestUrls";
import { fallbackMovies } from "../../Data/Data";
import styles from "./DetailModal.module.css";

function DetailModal() {
	const { activeDetail, closeDetail, playTrailer, toggleMyList, isInMyList, showToast } = useMovie();
	const { isOpen, movie } = activeDetail;

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				closeDetail();
			}
		};
		if (isOpen) {
			window.addEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "hidden";
		}
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "auto";
		};
	}, [isOpen, closeDetail]);

	if (!isOpen || !movie) return null;

	const title = movie.title || movie.name || movie.original_name || "Movie Title";
	const inList = isInMyList(movie.id);

	// Image resolution
	const backdropUrl = movie.localBackdrop || movie.backdrop_path
		? movie.localBackdrop || (movie.backdrop_path?.startsWith("http")
			? movie.backdrop_path
			: `${TMDB_IMAGE_BASE}${movie.backdrop_path}`)
		: movie.poster_path?.startsWith("http")
		? movie.poster_path
		: `${TMDB_IMAGE_BASE}${movie.poster_path}`;

	const releaseYear = (
		movie.release_date ||
		movie.first_air_date ||
		"2024"
	).substring(0, 4);

	const matchPercentage =
		movie.matchScore ||
		`${Math.min(99, Math.max(85, Math.round((movie.vote_average || 8.5) * 10)))}% Match`;

	const genres =
		movie.genres && typeof movie.genres[0] === "string"
			? movie.genres
			: movie.genre_ids
			? ["Drama", "Action", "Thriller"]
			: ["Exciting", "Blockbuster", "Drama"];

	// Similar titles from local curated database
	const similarList = fallbackMovies
		.filter((m) => m.id !== movie.id)
		.slice(0, 6);

	return (
		<div className={styles.overlay} onClick={closeDetail}>
			<div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
				{/* Close Button */}
				<button className={styles.closeBtn} onClick={closeDetail} aria-label="Close modal">
					<X size={22} />
				</button>

				{/* Hero Backdrop */}
				<div
					className={styles.hero}
					style={{
						backgroundImage: `linear-gradient(to top, #181818 0%, rgba(24, 24, 24, 0.4) 50%, rgba(24, 24, 24, 0) 100%), url("${backdropUrl}")`,
					}}>
					<div className={styles.heroContent}>
						<h1 className={styles.title}>{title}</h1>

						<div className={styles.buttonRow}>
							<button
								className={styles.playButton}
								onClick={() => {
									playTrailer(movie);
								}}>
								<Play size={22} fill="currentColor" />
								<span>Play</span>
							</button>

							<button
								className={`${styles.circleBtn} ${inList ? styles.inListActive : ""}`}
								onClick={() => toggleMyList(movie)}
								title={inList ? "Remove from My List" : "Add to My List"}>
								{inList ? <Check size={20} /> : <Plus size={20} />}
							</button>

							<button
								className={styles.circleBtn}
								onClick={() => {
									showToast(`Rated "${title}" 👍 (Saved to AI Profile)`);
									axios
										.post(requests.postMoviePreference, {
											userId: 1,
											movieId: movie.id,
											movieTitle: title,
											genres: genres,
											rating: 5,
										})
										.catch((err) => console.log("Backend pref sync:", err.message));
								}}
								title="I like this">
								<ThumbsUp size={18} />
							</button>
						</div>
					</div>
				</div>

				{/* Modal Body */}
				<div className={styles.body}>
					<div className={styles.bodyGrid}>
						{/* Left Column: Metadata & Overview */}
						<div className={styles.mainInfo}>
							<div className={styles.badgeRow}>
								<span className={styles.matchScore}>{matchPercentage}</span>
								<span className={styles.year}>{releaseYear}</span>
								<span className={styles.ageBadge}>
									{movie.matureRating || (movie.adult ? "18+" : "U/A 16+")}
								</span>
								<span className={styles.duration}>
									{movie.duration || (movie.category?.includes("TV") ? "1 Season" : "2h 08m")}
								</span>
								<span className={styles.qualityTag}>{movie.quality || "Ultra HD 4K"}</span>
							</div>

							<p className={styles.overview}>
								{movie.overview ||
									"When a sudden turn of events threatens everything they hold dear, an unexpected alliance forms to confront the ultimate mystery. A breathtaking cinematic journey now on Netflix."}
							</p>
						</div>

						{/* Right Column: Cast, Genres, Mood */}
						<div className={styles.sideInfo}>
							<div className={styles.metaField}>
								<span className={styles.metaLabel}>Genres: </span>
								<span className={styles.metaValue}>
									{genres.join(", ")}
								</span>
							</div>
							<div className={styles.metaField}>
								<span className={styles.metaLabel}>Audio: </span>
								<span className={styles.metaValue}>English [Original], Spanish, French</span>
							</div>
							<div className={styles.metaField}>
								<span className={styles.metaLabel}>Subtitles: </span>
								<span className={styles.metaValue}>English, Spanish, French, Arabic</span>
							</div>
							<div className={styles.metaField}>
								<span className={styles.metaLabel}>This title is: </span>
								<span className={styles.metaValue}>Exciting, Suspenseful, Visually Striking</span>
							</div>
						</div>
					</div>

					{/* More Like This Section */}
					<div className={styles.similarSection}>
						<h3 className={styles.sectionHeading}>More Like This</h3>
						<div className={styles.similarGrid}>
							{similarList.map((item) => (
								<div key={item.id} className={styles.similarCard}>
									<div className={styles.similarImageWrapper}>
										<img
											src={
												item.localPoster ||
												(item.poster_path?.startsWith("http")
													? item.poster_path
													: `${TMDB_POSTER_BASE}${item.poster_path}`)
											}
											alt={item.title || item.name}
											className={styles.similarImage}
											onError={(e) => {
												e.currentTarget.onerror = null;
												e.currentTarget.src = fallbackMovies[0].localPoster;
											}}
										/>
										<div className={styles.similarOverlay}>
											<button
												className={styles.similarPlayBtn}
												onClick={() => playTrailer(item)}>
												<Play size={20} fill="#000" />
											</button>
										</div>
									</div>
									<div className={styles.similarInfo}>
										<div className={styles.similarHeader}>
											<span className={styles.similarMatch}>
												{item.matchScore || "94% Match"}
											</span>
											<span className={styles.similarYear}>
												{(item.release_date || "2024").substring(0, 4)}
											</span>
										</div>
										<h4 className={styles.similarTitle}>{item.title || item.name}</h4>
										<p className={styles.similarDesc}>
											{item.overview
												? item.overview.length > 90
													? item.overview.substring(0, 90) + "..."
													: item.overview
												: "Streaming on Netflix."}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* About the movie */}
					<div className={styles.aboutSection}>
						<h3 className={styles.sectionHeading}>About {title}</h3>
						<p className={styles.aboutText}>
							<strong>Director:</strong> Christopher Nolan, Denis Villeneuve, The Duffer Brothers
						</p>
						<p className={styles.aboutText}>
							<strong>Cast:</strong> Leonardo DiCaprio, Cillian Murphy, Florence Pugh, Pedro Pascal
						</p>
						<p className={styles.aboutText}>
							<strong>Maturity Rating:</strong> Recommended for ages 16 and up. Contains intense sequences and thematic elements.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default DetailModal;
