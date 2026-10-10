import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import styles from "./GenreDropdown.module.css";

function GenreDropdown({
	genres = [],
	selectedGenre = "all",
	onSelectGenre,
	label = "Genres",
}) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Close on click outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			window.addEventListener("keydown", handleKeyDown);
		}
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const currentGenreObj = genres.find((g) => g.id === selectedGenre);
	const displayTitle = currentGenreObj
		? `${label}: ${currentGenreObj.name}`
		: `${label}: All`;

	return (
		<div className={styles.genreDropdownWrapper} ref={dropdownRef}>
			{/* Trigger Button Matching Netflix Design */}
			<button
				type="button"
				className={`${styles.triggerButton} ${isOpen ? styles.triggerButtonOpen : ""}`}
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				aria-label="Filter by genre">
				<span className={styles.buttonText}>{displayTitle}</span>
				<ChevronDown
					size={16}
					className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
				/>
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className={styles.dropdownMenu} role="listbox">
					<div className={styles.menuHeader}>
						<span className={styles.menuTitle}>Select Genre</span>
						{selectedGenre !== "all" && (
							<button
								className={styles.resetBtn}
								onClick={() => {
									onSelectGenre("all");
									setIsOpen(false);
								}}>
								Reset to All
							</button>
						)}
					</div>

					<div className={styles.genresGrid}>
						{genres.map((genre) => {
							const isSelected = selectedGenre === genre.id;
							return (
								<button
									key={genre.id}
									type="button"
									role="option"
									aria-selected={isSelected}
									className={`${styles.genreItem} ${
										isSelected ? styles.genreItemSelected : ""
									}`}
									onClick={() => {
										onSelectGenre(genre.id);
										setIsOpen(false);
									}}>
									<span className={styles.genreName}>{genre.name}</span>
									{isSelected && <Check size={14} className={styles.checkIcon} />}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

export default GenreDropdown;
