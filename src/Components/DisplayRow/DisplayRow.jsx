import React, { useEffect, useState } from "react";
import axios from "axios";
import SlideShow from "../SlideShow/SlideShow";
import movieInstance from "../../Utility/MovieInstance";
import requests from "../../Utility/requestUrls";
import { fallbackMovies } from "../../Data/Data";
import styles from "./DisplayRow.module.css";

function DisplayRow() {
	const [categories, setCategories] = useState({
		aiRecommendations: [],
		netflixOriginals: [],
		trending: [],
		topRated: [],
		action: [],
		comedy: [],
		horror: [],
		romance: [],
		documentaries: [],
		scifi: [],
		animation: [],
	});

	useEffect(() => {
		let isMounted = true;

		async function fetchAllRows() {
			try {
				const [
					origRes,
					trendRes,
					topRes,
					actRes,
					comRes,
					horRes,
					romRes,
					docRes,
					sciRes,
					animRes,
					aiRes,
				] = await Promise.allSettled([
					movieInstance.get(requests.fetchNetflixOriginals),
					movieInstance.get(requests.fetchTrending),
					movieInstance.get(requests.fetchTopRatedMovies),
					movieInstance.get(requests.fetchActionMovies),
					movieInstance.get(requests.fetchComedyMovies),
					movieInstance.get(requests.fetchHorrorMovies),
					movieInstance.get(requests.fetchRomanceMovies),
					movieInstance.get(requests.fetchDocumentaries),
					movieInstance.get(requests.fetchSciFiMovies),
					movieInstance.get(requests.fetchAnimationMovies),
					axios.get(requests.fetchAiRecommendations, { timeout: 8000 }),
				]);

				if (isMounted) {
					setCategories({
						aiRecommendations:
							aiRes.status === "fulfilled" && aiRes.value.data?.movies?.length > 0
								? aiRes.value.data.movies
								: [],
						netflixOriginals:
							origRes.status === "fulfilled"
								? origRes.value.data.results
								: fallbackMovies,
						trending:
							trendRes.status === "fulfilled"
								? trendRes.value.data.results
								: fallbackMovies,
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
						documentaries:
							docRes.status === "fulfilled"
								? docRes.value.data.results
								: fallbackMovies,
						scifi:
							sciRes.status === "fulfilled"
								? sciRes.value.data.results
								: fallbackMovies,
						animation:
							animRes.status === "fulfilled"
								? animRes.value.data.results
								: fallbackMovies,
					});
				}
			} catch (err) {
				console.log("Error loading rows, using fallback dataset:", err);
				if (isMounted) {
					setCategories({
						aiRecommendations: [],
						netflixOriginals: fallbackMovies,
						trending: fallbackMovies,
						topRated: fallbackMovies,
						action: fallbackMovies,
						comedy: fallbackMovies,
						horror: fallbackMovies,
						romance: fallbackMovies,
						documentaries: fallbackMovies,
						scifi: fallbackMovies,
						animation: fallbackMovies,
					});
				}
			}
		}

		fetchAllRows();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<section className={styles.rowsWrapper}>
			{/* AI Recommendations from Backend */}
			{categories.aiRecommendations && categories.aiRecommendations.length > 0 && (
				<SlideShow
					title="Top Picks for You"
					movies={categories.aiRecommendations}
					isLarge={true}
				/>
			)}

			{/* Netflix Originals (Tall Cards) */}
			<SlideShow
				title="NETFLIX ORIGINALS"
				movies={categories.netflixOriginals}
				isLarge={true}
			/>

			{/* Trending Now (Top 10 Styled) */}
			<SlideShow
				title="Top 10 in Movies & TV Today"
				movies={categories.trending}
				isTop10={true}
			/>

			{/* Top Rated */}
			<SlideShow
				title="Critically Acclaimed & Top Rated"
				movies={categories.topRated}
			/>

			{/* Action */}
			<SlideShow
				title="Action & High-Adrenaline Thrillers"
				movies={categories.action}
			/>

			{/* Comedies */}
			<SlideShow
				title="Laugh-Out-Loud Comedies"
				movies={categories.comedy}
			/>

			{/* Sci-Fi */}
			<SlideShow
				title="Sci-Fi & Futuristic Fantasy"
				movies={categories.scifi}
			/>

			{/* Horror */}
			<SlideShow
				title="Horror & Psychological Suspense"
				movies={categories.horror}
			/>

			{/* Romance */}
			<SlideShow
				title="Romantic Favorites & Dramas"
				movies={categories.romance}
			/>

			{/* Animation */}
			<SlideShow
				title="Animation & Family Night"
				movies={categories.animation}
			/>

			{/* Documentaries */}
			<SlideShow
				title="Compelling Documentaries"
				movies={categories.documentaries}
			/>
		</section>
	);
}

export default DisplayRow;
