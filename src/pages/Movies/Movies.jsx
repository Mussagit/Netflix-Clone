import React, { useEffect, useState } from "react";
import Banner from "../../Components/Banner/Banner";
import SlideShow from "../../Components/SlideShow/SlideShow";
import GenreDropdown from "../../Components/GenreDropdown/GenreDropdown";
import MovieCard from "../../Components/MovieCard/MovieCard";
import movieInstance from "../../Utility/MovieInstance";
import requests from "../../Utility/requestUrls";
import { fallbackMovies } from "../../Data/Data";
import { LayoutGrid, Rows3 } from "lucide-react";
import styles from "./Movies.module.css";

const MOVIE_GENRES = [
	{ id: "all", name: "All" },
	{ id: "action", name: "Action & Adventure" },
	{ id: "comedy", name: "Comedies" },
	{ id: "horror", name: "Horror & Thrillers" },
	{ id: "romance", name: "Romantic Films" },
	{ id: "scifi", name: "Sci-Fi & Fantasy" },
	{ id: "topRated", name: "Critically Acclaimed" },
	{ id: "upcoming", name: "Upcoming Releases" },
];

function Movies() {
	const [movieRows, setMovieRows] = useState({
		topRated: [],
		action: [],
		comedy: [],
		horror: [],
		romance: [],
		scifi: [],
		upcoming: [],
	});

	const [selectedGenre, setSelectedGenre] = useState("all");
	const [viewMode, setViewMode] = useState("rows"); // "rows" or "grid"

	useEffect(() => {
		let isMounted = true;

		async function fetchMoviesData() {
			try {
				const [
					topRes,
					actRes,
					comRes,
					horRes,
					romRes,
					sciRes,
					upRes,
				] = await Promise.allSettled([
					movieInstance.get(requests.fetchTopRatedMovies),
					movieInstance.get(requests.fetchActionMovies),
					movieInstance.get(requests.fetchComedyMovies),
					movieInstance.get(requests.fetchHorrorMovies),
					movieInstance.get(requests.fetchRomanceMovies),
					movieInstance.get(requests.fetchSciFiMovies),
					movieInstance.get(requests.fetchUpcomingMovies),
				]);

				if (isMounted) {
					setMovieRows({
						topRated:
							topRes.status === "fulfilled"
								? topRes.value.data.results
								: fallbackMovies,
						action:
							actRes.status === "fulfilled"
								? actRes.value.data.results
								: fallbackMovies,
						comedy:
							comRes.status === "fulfilled"
								? comRes.value.data.results
								: fallbackMovies,
						horror:
							horRes.status === "fulfilled"
								? horRes.value.data.results
								: fallbackMovies,
						romance:
							romRes.status === "fulfilled"
								? romRes.value.data.results
								: fallbackMovies,
						scifi:
							sciRes.status === "fulfilled"
								? sciRes.value.data.results
								: fallbackMovies,
						upcoming:
							upRes.status === "fulfilled"
								? upRes.value.data.results
								: fallbackMovies,
					});
				}
			} catch (err) {
				console.log("Error loading movies, using fallback dataset:", err);
				if (isMounted) {
					setMovieRows({
						topRated: fallbackMovies,
						action: fallbackMovies,
						comedy: fallbackMovies,
						horror: fallbackMovies,
						romance: fallbackMovies,
						scifi: fallbackMovies,
						upcoming: fallbackMovies,
					});
				}
			}
		}

		fetchMoviesData();

		return () => {
			isMounted = false;
		};
	}, []);

	const getActiveGenreMovies = () => {
		switch (selectedGenre) {
			case "action":
				return movieRows.action;
			case "comedy":
				return movieRows.comedy;
			case "horror":
				return movieRows.horror;
			case "romance":
				return movieRows.romance;
			case "scifi":
				return movieRows.scifi;
			case "topRated":
				return movieRows.topRated;
			case "upcoming":
				return movieRows.upcoming;
			default:
				return [
					...movieRows.topRated,
					...movieRows.action,
					...movieRows.scifi,
				];
		}
	};

	return (
		<div className={styles.moviesContainer}>
			{/* Movies Hero Banner */}
			<Banner categoryUrl={requests.fetchTopRatedMovies} fallbackCategory="Blockbusters" />

			{/* Sub-Header / Filter Bar */}
			<div className={styles.subHeader}>
				<div className={styles.leftSubHeader}>
					<h1 className={styles.pageTitle}>Movies</h1>
					<GenreDropdown
						genres={MOVIE_GENRES}
						selectedGenre={selectedGenre}
						onSelectGenre={setSelectedGenre}
						label="Genres"
					/>
				</div>

				{/* View Mode Toggle */}
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
							{MOVIE_GENRES.find((g) => g.id === selectedGenre)?.name || "All"}{" "}
							Movies
						</h2>
						{selectedGenre !== "all" && (
							<button
								className={styles.clearFilterLink}
								onClick={() => setSelectedGenre("all")}>
								Reset to All Movies
							</button>
						)}
					</div>
					<div className={styles.moviesGrid}>
						{getActiveGenreMovies().map((item, idx) => (
							<div key={item.id || idx} className={styles.gridItem}>
								<MovieCard movie={item} />
							</div>
						))}
					</div>
				</div>
			) : (
				<div className={styles.rowsContent}>
					{(selectedGenre === "all" || selectedGenre === "topRated") && (
						<SlideShow
							title="Blockbuster Hits & Critically Acclaimed"
							movies={movieRows.topRated}
							isLarge={true}
						/>
					)}

					{(selectedGenre === "all" || selectedGenre === "action") && (
						<SlideShow
							title="High-Octane Action & Adventure"
							movies={movieRows.action}
						/>
					)}

					{(selectedGenre === "all" || selectedGenre === "scifi") && (
						<SlideShow
							title="Sci-Fi & Mind-Bending Realities"
							movies={movieRows.scifi}
						/>
					)}

					{(selectedGenre === "all" || selectedGenre === "comedy") && (
						<SlideShow
							title="Laugh-Out-Loud Comedies"
							movies={movieRows.comedy}
						/>
					)}

					{(selectedGenre === "all" || selectedGenre === "horror") && (
						<SlideShow
							title="Chilling Horror & Dark Thrillers"
							movies={movieRows.horror}
						/>
					)}

					{(selectedGenre === "all" || selectedGenre === "romance") && (
						<SlideShow
							title="Romantic Favorites & Dramas"
							movies={movieRows.romance}
						/>
					)}

					<SlideShow
						title="Upcoming Releases on Netflix"
						movies={movieRows.upcoming}
					/>
				</div>
			)}
		</div>
	);
}

export default Movies;
