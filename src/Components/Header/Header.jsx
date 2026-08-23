import React, { useState, useEffect } from "react";
import logo from "../../assets/image/logo.png";
import { Link } from "react-router-dom";
import { Search, Bell, User, ChevronDown } from "lucide-react";
import styles from "./Header.module.css";

function Header() {
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 50) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
			<div className={styles.container}>
				{/* logo */}
				<img className={styles.logo} src={logo} alt="" />

				{/* navigation links */}
				<nav className={styles.nav}>
					<Link className={styles.navLink} to="">
						Home
					</Link>
					<Link className={styles.navLink} to="">
						Tv Shows
					</Link>
					<Link className={styles.navLink} to="">
						Movies
					</Link>
					<Link className={styles.navLink} to="">
						New & Popular
					</Link>
					<Link className={styles.navLink} to="">
						My List
					</Link>
					<Link className={styles.navLink} to="">
						Browse by Language
					</Link>
				</nav>

				{/* right side section */}
				<div className={styles.rightSection}>
					{/* search */}
					<div className={styles.searchContainer}>
						<button
							onClick={() => setIsSearchOpen(!isSearchOpen)}
							className={styles.searchButton}>
							<Search size={20} />
						</button>
						{isSearchOpen && (
							<input
								type="text"
								placeholder="movie title"
								className={styles.searchInput}
							/>
						)}
					</div>

					{/* Notification */}
					<button className={styles.iconButton}>
						<Bell size={20} />
						<span className={styles.notificationBadge}>4</span>
					</button>

					{/* Profile */}
					<div className={styles.profileContainer}>
						<button
							onClick={() => setIsProfileOpen(!isProfileOpen)}
							className={styles.profileButton}>
							<div className={styles.profileAvatar}>
								<User size={20} />
							</div>
							<ChevronDown size={20} />
						</button>

						{isProfileOpen && (
							<div className={styles.profileMenu}>
								<Link to="" className={styles.profileMenuItem}>
									Account
								</Link>
								<Link to="" className={styles.profileMenuItem}>
									help Center
								</Link>
								<hr className={styles.profileMenuDivider} />
								<button className={styles.profileMenuItem}>Sign out</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}

export default Header;
