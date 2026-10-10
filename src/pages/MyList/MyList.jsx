import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMovie } from "../../context/MovieContext";
import { TMDB_POSTER_BASE, TMDB_THUMBNAIL_BASE } from "../../Utility/requestUrls";
import { fallbackMovies } from "../../Data/Data";
import { Play, Trash2, Info, Film, PlusCircle, ArrowUpDown } from "lucide-react";
import styles from "./MyList.module.css";

function MyList() {
	const { myList, removeFromMyList, playTrailer, openDetail } = useMovie();
	const [filterType, setFilterType] = useState("all");
	const [sortBy, setSortBy] = useState("default");

	// Filter
	const filteredList = myList.filter((item) => {
		if (filterType === "movies") {
			return item.media_type === "movie" || (!item.first_air_date && !item.category?.includes("TV"));
		}
		if (filterType === "tv") {
			return item.media_type === "tv" || item.first_air_date || item.category?.includes("TV");
		}
		return true;
	});

	// Sort
	const sortedList = [...filteredList].sort((a, b) => {
		if (sortBy === "title") {
			const titleA = (a.title || a.name || "").toLowerCase();
			const titleB = (b.title || b.name || "").toLowerCase();
			return titleA.localeCompare(titleB);
		}
		if (sortBy === "rating") {
			return (b.vote_average || 0) - (a.vote_average || 0);
		}
		return 0; // default order
	});

	return (
		<div className={styles.myListContainer}>
			<div className={styles.headerBar}>
				<div className={styles.titleSection}>
					<h1 className={styles.pageTitle}>My List</h1>
					<span className={styles.countBadge}>
						{filteredList.length} {filteredList.length === 1 ? "title" : "titles"}
					</span>
				</div>

				{/* Controls: Filter & Sort */}
				{myList.length > 0 && (
					<div className={styles.controls}>
						<div className={styles.filterGroup}>
							<button
								className={`${styles.filterBtn} ${
									filterType === "all" ? styles.filterBtnActive : ""
								}`}
								onClick={() => setFilterType("all")}>
								All
							</button>
							<button
								className={`${styles.filterBtn} ${
									filterType === "movies" ? styles.filterBtnActive : ""
								}`}
								onClick={() => setFilterType("movies")}>
								Movies
							</button>
							<button
								className={`${styles.filterBtn} ${
									filterType === "tv" ? styles.filterBtnActive : ""
								}`}
								onClick={() => setFilterType("tv")}>
								TV Shows
							</button>
						</div>

						<div className={styles.sortWrapper}>
							<ArrowUpDown size={15} color="#aaa" />
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className={styles.sortSelect}
								aria-label="Sort My List">
								<option value="default">Sort: Added order</option>
								<option value="title">Sort: Title (A-Z)</option>
								<option value="rating">Sort: Highest Rated</option>
							</select>
						</div>
					</div>
				)}
			</div>

			{/* Empty State */}
			{myList.length === 0 ? (
				<div className={styles.emptyState}>
					<div className={styles.emptyIconWrap}>
						<Film size={54} color="#e50914" />
					</div>
					<h2>Your List is empty</h2>
					<p>
						Explore titles from the home page and click the <strong>+</strong> icon
						to save movies and shows you want to watch later.
					</p>
					<Link to="/" className={styles.exploreBtn}>
						<PlusCircle size={18} />
						<span>Explore Netflix</span>
					</Link>
				</div>
			) : sortedList.length === 0 ? (
				<div className={styles.emptyFilterState}>
					<p>No {filterType === "movies" ? "movies" : "TV shows"} in your list.</p>
					<button
						className={styles.resetFilterBtn}
						onClick={() => setFilterType("all")}>
						Show All Items
					</button>
				</div>
			) : (
				/* Grid of Saved Items */
				<div className={styles.grid}>
					{sortedList.map((movie) => {
						const title =
							movie.title || movie.name || movie.original_name || "Untitled";

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

						const matchScore =
							movie.matchScore ||
							`${Math.round((movie.vote_average || 8.2) * 10)}% Match`;

						return (
							<div key={movie.id} className={styles.card}>
								<div className={styles.imageContainer}>
									<img
										src={imageSrc}
										alt={title}
										loading="lazy"
										onError={(e) => {
											e.currentTarget.onerror = null;
											e.currentTarget.src = fallbackMovies[0].localBackdrop;
										}}
									/>
									<div className={styles.overlay}>
										<div className={styles.actionRow}>
											<button
												className={styles.playActionBtn}
												onClick={() => playTrailer(movie)}
												title="Play Trailer">
												<Play size={18} fill="#000" color="#000" />
											</button>
											<button
												className={styles.removeActionBtn}
												onClick={() => removeFromMyList(movie.id)}
												title="Remove from My List">
												<Trash2 size={16} />
											</button>
											<button
												className={styles.infoActionBtn}
												onClick={() => openDetail(movie)}
												title="More Info">
												<Info size={16} />
											</button>
										</div>
									</div>
								</div>

								<div className={styles.cardInfo}>
									<h3 className={styles.cardTitle}>{title}</h3>
									<div className={styles.cardMeta}>
										<span className={styles.match}>{matchScore}</span>
										<span className={styles.tag}>
											{movie.matureRating || (movie.adult ? "18+" : "U/A 13+")}
										</span>
										<span className={styles.year}>
											{(
												movie.release_date ||
												movie.first_air_date ||
												"2024"
											).substring(0, 4)}
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

export default MyList;
