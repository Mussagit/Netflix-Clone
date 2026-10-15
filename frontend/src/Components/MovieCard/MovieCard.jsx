import React from "react";
import axios from "axios";
import { FaCirclePlay } from "react-icons/fa6";
import { BsPlusCircle, BsCheckCircleFill } from "react-icons/bs";
import { IoIosArrowDropdownCircle } from "react-icons/io";
import { BiLike } from "react-icons/bi";
import { useMovie } from "../../context/MovieContext";
import requests, { TMDB_POSTER_BASE, TMDB_THUMBNAIL_BASE } from "../../Utility/requestUrls";
import { fallbackMovies } from "../../Data/Data";
import styles from "./MovieCard.module.css";

function MovieCard({ movie, isLarge = false, rank = null }) {
	const { playTrailer, openDetail, toggleMyList, isInMyList, showToast } = useMovie();

	if (!movie) return null;

	const inList = isInMyList(movie.id);
	const title = movie.title || movie.name || movie.original_name || "Movie";

	// Poster image resolution
	const imageSrc =
		movie.localPoster ||
		(isLarge
			? movie.poster_path
				? movie.poster_path.startsWith("http")
					? movie.poster_path
					: `${TMDB_POSTER_BASE}${movie.poster_path}`
				: movie.backdrop_path
			: movie.backdrop_path
			? movie.backdrop_path.startsWith("http")
				? movie.backdrop_path
				: `${TMDB_THUMBNAIL_BASE}${movie.backdrop_path}`
			: movie.poster_path?.startsWith("http")
			? movie.poster_path
			: `${TMDB_THUMBNAIL_BASE}${movie.poster_path}`);

	const hoverImageSrc =
		movie.localBackdrop ||
		(movie.backdrop_path
			? movie.backdrop_path.startsWith("http")
				? movie.backdrop_path
				: `${TMDB_THUMBNAIL_BASE}${movie.backdrop_path}`
			: imageSrc);

	const matchRating =
		movie.matchScore ||
		`${Math.min(99, Math.max(85, Math.round((movie.vote_average || 8.2) * 10)))}% Match`;

	const genres =
		movie.genres && typeof movie.genres[0] === "string"
			? movie.genres
			: ["Exciting", "Blockbuster", "Drama"];

	return (
		<div className={`${styles.cardWrapper} ${isLarge ? styles.largeCardWrapper : ""}`}>
			{/* Ranked number if Top 10 */}
			{rank !== null && (
				<div className={styles.rankBadge}>
					<span className={styles.rankNumber}>{rank}</span>
				</div>
			)}

			{/* Top 10 Red Corner Badge matching Screenshot 5 */}
			{rank !== null && rank <= 10 && (
				<div className={styles.topTenPill}>
					<span>TOP</span>
					<span>10</span>
				</div>
			)}

			{/* Static Base Image */}
			<img
				className={`${styles.poster} ${isLarge ? styles.largePoster : ""}`}
				src={imageSrc}
				alt={title}
				loading="lazy"
				onError={(e) => {
					e.currentTarget.onerror = null;
					e.currentTarget.src = fallbackMovies[0].localPoster;
				}}
			/>

			{/* Interactive Hover Card */}
			<div className={styles.hoverCard}>
				<div className={styles.hoverImageWrap} onClick={() => playTrailer(movie)}>
					<img
						className={styles.hoverImage}
						src={hoverImageSrc}
						alt={title}
						onError={(e) => {
							e.currentTarget.onerror = null;
							e.currentTarget.src = fallbackMovies[0].localBackdrop;
						}}
					/>
					<div className={styles.hoverPlayOverlay}>
						<FaCirclePlay size={44} color="#fff" />
					</div>
					<div className={styles.badge}>
						{movie.badge || (rank ? `#${rank} in TV Today` : "Recently added")}
					</div>
				</div>

				<div className={styles.hoverBody}>
					{/* Action Buttons Row */}
					<div className={styles.buttonsRow}>
						<button
							className={styles.playBtn}
							onClick={(e) => {
								e.stopPropagation();
								playTrailer(movie);
							}}
							title="Play">
							<FaCirclePlay size={34} color="#ffffff" />
						</button>

						<button
							className={styles.iconBtn}
							onClick={(e) => {
								e.stopPropagation();
								toggleMyList(movie);
							}}
							title={inList ? "Remove from My List" : "Add to My List"}>
							{inList ? (
								<BsCheckCircleFill size={30} color="#e50914" />
							) : (
								<BsPlusCircle size={30} color="#ffffff" />
							)}
						</button>

						<button
							className={styles.iconBtn}
							onClick={(e) => {
								e.stopPropagation();
								showToast(`Rated "${title}" 👍 (Saved to AI Profile)`);
								axios
									.post(requests.postMoviePreference, {
										userId: 1,
										movieId: movie.id,
										movieTitle: title,
										genres: genres,
										rating: 5,
									})
									.catch((err) => console.log("Backend preference sync:", err.message));
							}}
							title="I like this">
							<BiLike size={24} color="#ffffff" />
						</button>

						<button
							className={styles.dropdownBtn}
							onClick={(e) => {
								e.stopPropagation();
								openDetail(movie);
							}}
							title="Episode & More Info">
							<IoIosArrowDropdownCircle size={32} color="#ffffff" />
						</button>
					</div>

					{/* Title & Metadata */}
					<h4 className={styles.movieTitle}>{title}</h4>

					<div className={styles.metaRow}>
						<span className={styles.match}>{matchRating}</span>
						<span className={styles.tag}>
							{movie.matureRating || (movie.adult ? "18+" : "U/A 16+")}
						</span>
						<span className={styles.tag}>
							{movie.duration || (movie.media_type === "tv" ? "1 Season" : "HD")}
						</span>
					</div>

					{/* Genres */}
					<div className={styles.genres}>
						{genres.slice(0, 3).map((g, index) => (
							<span key={index}>
								{g}
								{index < Math.min(genres.length, 3) - 1 && (
									<span className={styles.dot}>•</span>
								)}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export default MovieCard;
