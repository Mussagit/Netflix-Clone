import React, { useEffect, useState } from "react";
import Banner from "../../Components/Banner/Banner";
import SlideShow from "../../Components/SlideShow/SlideShow";
import GenreDropdown from "../../Components/GenreDropdown/GenreDropdown";
import MovieCard from "../../Components/MovieCard/MovieCard";
import movieInstance from "../../Utility/MovieInstance";
import requests from "../../Utility/requestUrls";
import { fallbackMovies } from "../../Data/Data";
import { LayoutGrid, Rows3 } from "lucide-react";
import styles from "./TvShows.module.css";

const TV_GENRES = [
	{ id: "all", name: "All" },
	{ id: "action", name: "Action & Adventure" },
	{ id: "comedy", name: "Comedies & Sitcoms" },
	{ id: "drama", name: "Dramas" },
	{ id: "scifi", name: "Sci-Fi & Fantasy" },
	{ id: "topRated", name: "Critically Acclaimed" },
	{ id: "trending", name: "Trending TV" },
	{ id: "popular", name: "Popular on Netflix" },
];

function TvShows() {
	const [tvRows, setTvRows] = useState({
		trendingTv: [],
		topRatedTv: [],
		popularTv: [],
		actionTv: [],
		comedyTv: [],
		dramaTv: [],
		scifiTv: [],
	});

	const [selectedGenre, setSelectedGenre] = useState("all");
	const [viewMode, setViewMode] = useState("rows"); // "rows" or "grid"

	useEffect(() => {
		let isMounted = true;

		async function fetchTvData() {
			try {
				const [
					trendRes,
					topRes,
					popRes,
					actRes,
					comRes,
					dramRes,
					sciRes,
				] = await Promise.allSettled([
					movieInstance.get(requests.fetchTrendingTv),
					movieInstance.get(requests.fetchTopRatedTv),
					movieInstance.get(requests.fetchPopularTv),
					movieInstance.get(requests.fetchActionAdventureTv),
					movieInstance.get(requests.fetchComedyTv),
					movieInstance.get(requests.fetchDramaTv),
					movieInstance.get(requests.fetchSciFiTv),
				]);

				if (isMounted) {
					setTvRows({
						trendingTv:
							trendRes.status === "fulfilled"
								? trendRes.value.data.results
								: fallbackMovies,
						topRatedTv:
							topRes.status === "fulfilled"
								? topRes.value.data.results
								: fallbackMovies,
						popularTv:
							popRes.status === "fulfilled"
								? popRes.value.data.results
								: fallbackMovies,
						actionTv:
							actRes.status === "fulfilled"
								? actRes.value.data.results
								: fallbackMovies,
						comedyTv:
							comRes.status === "fulfilled"
								? comRes.value.data.results
								: fallbackMovies,
						dramaTv:
							dramRes.status === "fulfilled"
								? dramRes.value.data.results
								: fallbackMovies,
						scifiTv:
							sciRes.status === "fulfilled"
								? sciRes.value.data.results
								: fallbackMovies,
					});
				}
			} catch (err) {
				console.log("Error loading TV shows, using fallbacks:", err);
				if (isMounted) {
					setTvRows({
						trendingTv: fallbackMovies,
						topRatedTv: fallbackMovies,
						popularTv: fallbackMovies,
						actionTv: fallbackMovies,
						comedyTv: fallbackMovies,
						dramaTv: fallbackMovies,
						scifiTv: fallbackMovies,
					});
				}
			}
		}

		fetchTvData();

		return () => {
			isMounted = false;
		};
	}, []);

	// Get active list for grid view
	const getActiveGenreMovies = () => {
		switch (selectedGenre) {
			case "action":
				return tvRows.actionTv;
			case "comedy":
				return tvRows.comedyTv;
			case "drama":
				return tvRows.dramaTv;
			case "scifi":
				return tvRows.scifiTv;
			case "topRated":
				return tvRows.topRatedTv;
			case "popular":
				return tvRows.popularTv;
			case "trending":
				return tvRows.trendingTv;
			default:
				return [
					...tvRows.trendingTv,
					...tvRows.topRatedTv,
					...tvRows.actionTv,
				];
		}
	};

	return (
		<div className={styles.tvContainer}>
			{/* TV Hero Banner */}
			<Banner categoryUrl={requests.fetchPopularTv} fallbackCategory="TV Series" />

			{/* Sub-Header / Filter Bar */}
			<div className={styles.subHeader}>
				<div className={styles.leftSubHeader}>
					<h1 className={styles.pageTitle}>TV Shows</h1>
					<GenreDropdown
						genres={TV_GENRES}
						selectedGenre={selectedGenre}
						onSelectGenre={setSelectedGenre}
						label="Genres"
					/>
				</div>

				{/* View Mode Toggle (Rows / Grid) */}
				<div className={styles.viewToggleGroup}>
					<button
						type="button"
						className={`${styles.viewBtn} ${
							viewMode === "rows" ? styles.viewBtnActive : ""
						}`}
						onClick={() => setViewMode("rows")}
						aria-label="Carousel rows view">
						<Rows3 size={18} />
					</button>
					<button
						type="button"
						className={`${styles.viewBtn} ${
							viewMode === "grid" ? styles.viewBtnActive : ""
						}`}
						onClick={() => setViewMode("grid")}
						aria-label="Grid poster view">
						<LayoutGrid size={18} />
					</button>
				</div>
			</div>

			{/* Content Area: Grid View or Carousel Rows */}
			{viewMode === "grid" ? (
				<div className={styles.gridViewContainer}>
					<div className={styles.gridHeader}>
						<h2>
							{TV_GENRES.find((g) => g.id === selectedGenre)?.name || "All"}{" "}
							Titles
						</h2>
						{selectedGenre !== "all" && (
							<button
								className={styles.clearFilterLink}
								onClick={() => setSelectedGenre("all")}>
								Reset to All TV Shows
							</button>
						)}
					</div>
					<div className={styles.tvGrid}>
						{getActiveGenreMovies().map((item, idx) => (
							<div key={item.id || idx} className={styles.gridItem}>
								<MovieCard movie={item} />
							</div>
						))}
					</div>
				</div>
			) : (
				<div className={styles.rowsContent}>
					{(selectedGenre === "all" || selectedGenre === "trending") && (
						<SlideShow
							title="Trending TV Shows This Week"
							movies={tvRows.trendingTv}
							isTop10={true}
						/>
					)}

					{(selectedGenre === "all" || selectedGenre === "topRated") && (
						<SlideShow
							title="Top Rated TV Series"
							movies={tvRows.topRatedTv}
							isLarge={true}
						/>
					)}

					{(selectedGenre === "all" || selectedGenre === "action") && (
						<SlideShow
							title="Action & Adventure TV"
							movies={tvRows.actionTv}
						/>
					)}

					{(selectedGenre === "all" || selectedGenre === "comedy") && (
						<SlideShow
							title="TV Comedies & Sitcoms"
							movies={tvRows.comedyTv}
						/>
					)}

					{(selectedGenre === "all" || selectedGenre === "drama") && (
						<SlideShow
							title="Bingeworthy TV Dramas"
							movies={tvRows.dramaTv}
						/>
					)}

					{(selectedGenre === "all" || selectedGenre === "scifi") && (
						<SlideShow
							title="Sci-Fi & Supernatural Series"
							movies={tvRows.scifiTv}
						/>
					)}

					{(selectedGenre === "all" || selectedGenre === "popular") && (
						<SlideShow
							title="Popular TV on Netflix"
							movies={tvRows.popularTv}
						/>
					)}
				</div>
			)}
		</div>
	);
}

export default TvShows;

