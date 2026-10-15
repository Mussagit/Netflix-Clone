import React from "react";
import MovieCard from "../MovieCard/MovieCard";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import styles from "./SlideShow.module.css";

function SlideShow({ title, movies = [], isLarge = false, isTop10 = false }) {
	if (!movies || movies.length === 0) return null;

	return (
		<div className={`${styles.rowWrapper} ${isLarge ? styles.largeRowWrapper : ""}`}>
			<div className={styles.rowHeader}>
				<h2 className={styles.title}>{title}</h2>
				<span className={styles.exploreAll}>Explore All &gt;</span>
			</div>

			<div className={styles.carouselContainer}>
				<Swiper
					modules={[Navigation]}
					navigation
					spaceBetween={isTop10 ? 30 : 12}
					slidesPerView={isLarge ? 2.3 : 2.2}
					breakpoints={{
						480: {
							slidesPerView: isLarge ? 2.8 : 2.8,
							spaceBetween: 14,
						},
						768: {
							slidesPerView: isLarge ? 3.8 : 3.8,
							spaceBetween: 16,
						},
						1024: {
							slidesPerView: isLarge ? 4.8 : 4.8,
							spaceBetween: 18,
						},
						1400: {
							slidesPerView: isLarge ? 5.8 : 5.8,
							spaceBetween: 20,
						},
					}}
					className={styles.swiper}>
					{movies.map((movie, index) => (
						<SwiperSlide key={movie.id || index} className={styles.slide}>
							<MovieCard
								movie={movie}
								isLarge={isLarge}
								rank={isTop10 && index < 10 ? index + 1 : null}
							/>
						</SwiperSlide>
					))}
				</Swiper>
			</div>
		</div>
	);
}

export default SlideShow;
