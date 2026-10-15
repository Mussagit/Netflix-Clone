import React, { useEffect, useState } from "react";
import { Play, Info, Plus, Check, Volume2, VolumeX } from "lucide-react";
import { useMovie } from "../../context/MovieContext";
import movieInstance from "../../Utility/MovieInstance";
import requests, { TMDB_IMAGE_BASE } from "../../Utility/requestUrls";
import { defaultBannerMovie, fallbackMovies } from "../../Data/Data";
import styles from "./Banner.module.css";

function Banner({ categoryUrl }) {
	const { playTrailer, openDetail, toggleMyList, isInMyList } = useMovie();
	const [movie, setMovie] = useState(defaultBannerMovie);
	const [isMuted, setIsMuted] = useState(true);

	useEffect(() => {
		let isMounted = true;
		async function fetchBanner() {
			try {
				const endpoint = categoryUrl || requests.fetchNetflixOriginals;
				const res = await movieInstance.get(endpoint);
				const results = res.data?.results || [];
				if (results.length > 0 && isMounted) {
					// Choose a movie that has a nice backdrop
					const filtered = results.filter((m) => m.backdrop_path);
					const chosen =
						filtered[Math.floor(Math.random() * filtered.length)] ||
						results[0];
					setMovie(chosen);
				}
			} catch (err) {
				console.log("Banner fetch error, using curated fallback:", err);
				if (isMounted) {
					const randomFallback =
						fallbackMovies[Math.floor(Math.random() * fallbackMovies.length)];
					setMovie(randomFallback);
				}
			}
		}
		fetchBanner();
		return () => {
			isMounted = false;
		};
	}, [categoryUrl]);

	function truncate(str, n) {
		return str?.length > n ? str.substr(0, n - 1) + "..." : str;
	}

	const title =
		movie?.title || movie?.name || movie?.original_name || "Featured Title";
	const inList = isInMyList(movie?.id);

	const bgImage =
		movie?.localBackdrop ||
		(movie?.backdrop_path
			? movie.backdrop_path.startsWith("http")
				? movie.backdrop_path
				: `${TMDB_IMAGE_BASE}${movie.backdrop_path}`
			: defaultBannerMovie.backdrop_path);

	return (
		<div
			className={styles.banner}
			style={{
				backgroundImage: `linear-gradient(180deg, rgba(20, 20, 20, 0.2) 0%, rgba(20, 20, 20, 0.7) 70%, #141414 100%), url("${bgImage}")`,
			}}>
			<div className={styles.contents}>
				{/* Red Netflix Series/Film Tag */}
				<div className={styles.netflixTag}>
					<span className={styles.netflixWordmark}>NETFLIX</span>
				</div>

				{/* Title */}
				<h1 className={styles.title}>{title}</h1>

				{/* Overview */}
				<p className={styles.description}>
					{truncate(
						movie?.overview ||
							"Shondaland's Emmy-winning series brings Julia Quinn's novels to life, as eight siblings seek their perfect match amid London's scandals and soirées.",
						200
					)}
				</p>

				{/* Action Buttons matching Design 4 */}
				<div className={styles.buttonContainer}>
					<button
						className={styles.playButton}
						onClick={() => playTrailer(movie)}>
						<Play size={20} fill="currentColor" />
						<span>Play</span>
					</button>

					<button
						className={styles.infoButton}
						onClick={() => openDetail(movie)}>
						<Info size={20} />
						<span>More Info</span>
					</button>

					<button
						className={styles.myListButton}
						onClick={() => toggleMyList(movie)}>
						{inList ? <Check size={20} /> : <Plus size={20} />}
						<span>My List</span>
					</button>
				</div>
			</div>

			{/* Maturity & Sound Control on Right */}
			<div className={styles.bannerRightControl}>
				<button
					className={styles.soundButton}
					onClick={() => setIsMuted(!isMuted)}
					aria-label={isMuted ? "Unmute audio" : "Mute audio"}>
					{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
				</button>
				<div className={styles.ratingPill}>
					{movie?.matureRating || (movie?.adult ? "18+" : "U/A 13+")}
				</div>
			</div>

			{/* Bottom Fade Gradient */}
			<div className={styles.fadeBottom}></div>
		</div>
	);
}

export default Banner;
