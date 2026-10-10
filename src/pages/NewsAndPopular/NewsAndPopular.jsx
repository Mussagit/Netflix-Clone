import React, { useEffect, useState } from "react";
import Banner from "../../Components/Banner/Banner";
import SlideShow from "../../Components/SlideShow/SlideShow";
import movieInstance from "../../Utility/MovieInstance";
import requests from "../../Utility/requestUrls";
import { fallbackMovies } from "../../Data/Data";
import { Bell, Flame, Sparkles, Clock, Calendar } from "lucide-react";
import { useMovie } from "../../context/MovieContext";
import styles from "./NewsAndPopular.module.css";

function NewsAndPopular() {
	const { playTrailer, openDetail, showToast } = useMovie();
	const [popularData, setPopularData] = useState({
		top10: [],
		nowPlaying: [],
		upcoming: [],
		trending: [],
	});

	const [reminders, setReminders] = useState({});

	const toggleReminder = (id, title) => {
		setReminders((prev) => {
			const active = !prev[id];
			showToast(
				active
					? `Reminder set for "${title}". We'll notify you when it's out.`
					: `Reminder removed for "${title}".`
			);
			return { ...prev, [id]: active };
		});
	};

	useEffect(() => {
		let isMounted = true;

		async function fetchPopular() {
			try {
				const [topRes, nowRes, upRes, trendRes] = await Promise.allSettled([
					movieInstance.get(requests.fetchTrending),
					movieInstance.get(requests.fetchNowPlayingMovies),
					movieInstance.get(requests.fetchUpcomingMovies),
					movieInstance.get(requests.fetchTrendingTv),
				]);

				if (isMounted) {
					setPopularData({
						top10:
							topRes.status === "fulfilled"
								? topRes.value.data.results
								: fallbackMovies,
						nowPlaying:
							nowRes.status === "fulfilled"
								? nowRes.value.data.results
								: fallbackMovies,
						upcoming:
							upRes.status === "fulfilled"
								? upRes.value.data.results
								: fallbackMovies,
						trending:
							trendRes.status === "fulfilled"
								? trendRes.value.data.results
								: fallbackMovies,
					});
				}
			} catch (err) {
				console.log("Error fetching popular data:", err);
				if (isMounted) {
					setPopularData({
						top10: fallbackMovies,
						nowPlaying: fallbackMovies,
						upcoming: fallbackMovies,
						trending: fallbackMovies,
					});
				}
			}
		}

		fetchPopular();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<div className={styles.container}>
			{/* Hero Banner */}
			<Banner categoryUrl={requests.fetchUpcomingMovies} fallbackCategory="New on Netflix" />

			<div className={styles.content}>
				{/* Top 10 Row */}
				<div className={styles.sectionHeader}>
					<Flame className={styles.sectionIcon} size={26} color="#e50914" />
					<h2 className={styles.sectionTitle}>Top 10 Today</h2>
				</div>
				<SlideShow
					title="Top 10 in Your Country Today"
					movies={popularData.top10}
					isTop10={true}
				/>

				{/* New on Netflix */}
				<div className={styles.sectionHeader}>
					<Sparkles className={styles.sectionIcon} size={24} color="#54b9c5" />
					<h2 className={styles.sectionTitle}>New on Netflix</h2>
				</div>
				<SlideShow
					title="Fresh Releases & New Seasons"
					movies={popularData.nowPlaying}
					isLarge={true}
				/>

				{/* Worth The Wait (Upcoming with Dates) */}
				<div className={styles.sectionHeader}>
					<Clock className={styles.sectionIcon} size={24} color="#f59e0b" />
					<h2 className={styles.sectionTitle}>Worth the Wait</h2>
				</div>
				<div className={styles.upcomingGrid}>
					{(popularData.upcoming.length > 0 ? popularData.upcoming : fallbackMovies)
						.slice(0, 4)
						.map((movie, idx) => {
							const releaseDate =
								movie.release_date || "Coming Next Month";
							const isReminded = !!reminders[movie.id];
							const title = movie.title || movie.name || "Upcoming Title";

							return (
								<div key={movie.id || idx} className={styles.upcomingCard}>
									<div
										className={styles.upcomingThumb}
										onClick={() => openDetail(movie)}>
										<img
											src={
												movie.localBackdrop ||
												(movie.backdrop_path
													? movie.backdrop_path.startsWith("http")
														? movie.backdrop_path
														: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`
													: fallbackMovies[0].backdrop_path)
											}
											alt={title}
											loading="lazy"
											onError={(e) => {
												e.currentTarget.onerror = null;
												e.currentTarget.src = fallbackMovies[0].localBackdrop;
											}}
										/>
										<div className={styles.dateTag}>
											<Calendar size={13} />
											<span>{releaseDate}</span>
										</div>
									</div>

									<div className={styles.upcomingDetails}>
										<div className={styles.upcomingTopRow}>
											<h3 className={styles.upcomingTitle}>{title}</h3>
											<button
												className={`${styles.remindBtn} ${
													isReminded ? styles.remindBtnActive : ""
												}`}
												onClick={() => toggleReminder(movie.id, title)}>
												<Bell size={16} />
												<span>{isReminded ? "Reminded" : "Remind Me"}</span>
											</button>
										</div>

										<p className={styles.upcomingOverview}>
											{movie.overview ||
												"Get ready for this exciting new release arriving soon on Netflix worldwide."}
										</p>

										<div className={styles.upcomingFooter}>
											<button
												className={styles.trailerBtn}
												onClick={() => playTrailer(movie)}>
												Watch Trailer
											</button>
											<button
												className={styles.moreInfoBtn}
												onClick={() => openDetail(movie)}>
												More Info
											</button>
										</div>
									</div>
								</div>
							);
						})}
				</div>

				{/* Trending Series */}
				<SlideShow
					title="Trending TV Series Everyone is Talking About"
					movies={popularData.trending}
				/>
			</div>
		</div>
	);
}

export default NewsAndPopular;
