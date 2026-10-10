import React, { useEffect } from "react";
import { X, Plus, Check, Film } from "lucide-react";
import { useMovie } from "../../context/MovieContext";
import styles from "./TrailerModal.module.css";

function TrailerModal() {
	const { activeTrailer, closeTrailer, toggleMyList, isInMyList, openDetail } = useMovie();
	const { isOpen, movie, videoKey, isLoading } = activeTrailer;

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				closeTrailer();
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
	}, [isOpen, closeTrailer]);

	if (!isOpen || !movie) return null;

	const title = movie.title || movie.name || movie.original_name || "Trailer";
	const inList = isInMyList(movie.id);

	return (
		<div className={styles.overlay} onClick={closeTrailer}>
			<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
				{/* Close Button */}
				<button className={styles.closeBtn} onClick={closeTrailer} aria-label="Close Trailer">
					<X size={24} />
				</button>

				{/* Video Player Container */}
				<div className={styles.videoWrapper}>
					{isLoading ? (
						<div className={styles.loadingState}>
							<div className={styles.spinner}></div>
							<p>Loading trailer...</p>
						</div>
					) : videoKey ? (
						<iframe
							className={styles.iframe}
							src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&enablejsapi=1`}
							title={title}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
						/>
					) : (
						<div className={styles.fallbackPlayer}>
							<Film size={48} color="#e50914" />
							<h3>Trailer preview currently unavailable</h3>
							<p>Enjoy synopsis and full details below.</p>
						</div>
					)}
				</div>

				{/* Metadata & Actions footer */}
				<div className={styles.infoBar}>
					<div className={styles.infoLeft}>
						<h2 className={styles.title}>{title}</h2>
						<div className={styles.badgeRow}>
							<span className={styles.matchScore}>
								{movie.matchScore || `${Math.round((movie.vote_average || 8) * 10)}% Match`}
							</span>
							<span className={styles.year}>
								{(movie.release_date || movie.first_air_date || "2024").substring(0, 4)}
							</span>
							<span className={styles.ageBadge}>
								{movie.matureRating || (movie.adult ? "18+" : "13+")}
							</span>
							<span className={styles.qualityBadge}>{movie.quality || "4K Ultra HD"}</span>
						</div>
						<p className={styles.overview}>{movie.overview || "Now streaming on Netflix."}</p>
					</div>

					<div className={styles.infoRight}>
						<button
							className={`${styles.actionBtn} ${inList ? styles.inListBtn : ""}`}
							onClick={() => toggleMyList(movie)}>
							{inList ? <Check size={20} /> : <Plus size={20} />}
							{inList ? "In My List" : "Add to My List"}
						</button>
						<button
							className={styles.detailBtn}
							onClick={() => {
								closeTrailer();
								openDetail(movie);
							}}>
							More Details
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default TrailerModal;
