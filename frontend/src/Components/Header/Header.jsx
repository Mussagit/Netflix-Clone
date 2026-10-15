import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/image/logo.png";
import {
	Search,
	Bell,
	User,
	ChevronDown,
	X,
	Menu,
	Play,
	Film,
	LogOut,
} from "lucide-react";
import { useMovie } from "../../context/MovieContext";
import { TMDB_THUMBNAIL_BASE } from "../../Utility/requestUrls";
import styles from "./Header.module.css";

function Header() {
	const navigate = useNavigate();
	const {
		searchQuery,
		searchMovies,
		searchResults,
		isSearching,
		playTrailer,
		openDetail,
		activeProfile,
		switchProfile,
		showToast,
		myList,
		currentUser,
		authToken,
		logoutUser,
		openAccountModal,
	} = useMovie();

	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isNotificationOpen, setIsNotificationOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

	const searchInputRef = useRef(null);
	const searchContainerRef = useRef(null);
	const profileRef = useRef(null);
	const notifRef = useRef(null);

	// Close confirmation modal on Escape key
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape" && showSignOutConfirm) {
				setShowSignOutConfirm(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [showSignOutConfirm]);

	// Scroll detection
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 40) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Click outside to close dropdowns
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (profileRef.current && !profileRef.current.contains(e.target)) {
				setIsProfileOpen(false);
			}
			if (notifRef.current && !notifRef.current.contains(e.target)) {
				setIsNotificationOpen(false);
			}
			if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
				if (!searchQuery) {
					setIsSearchOpen(false);
				}
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [searchQuery]);

	// Auto-focus search input when opened
	useEffect(() => {
		if (isSearchOpen && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [isSearchOpen]);

	const closeMenus = () => {
		setIsMobileMenuOpen(false);
		setIsProfileOpen(false);
		setIsNotificationOpen(false);
	};

	const handleSearchToggle = () => {
		if (isSearchOpen && searchQuery) {
			searchMovies("");
		}
		setIsSearchOpen(!isSearchOpen);
	};

	const [notifications, setNotifications] = useState([
		{
			id: 1,
			title: "New Season Released",
			desc: "Monarch: Legacy of Monsters is now streaming in 4K HDR.",
			time: "2 hours ago",
			isNew: true,
		},
		{
			id: 2,
			title: "Top 10 in your country",
			desc: "Young Sherlock just climbed to #1 this week.",
			time: "1 day ago",
			isNew: true,
		},
		{
			id: 3,
			title: "Watchlist Update",
			desc: "Titles in your list have received high-definition audio updates.",
			time: "3 days ago",
			isNew: true,
		},
	]);

	const unreadCount = notifications.filter((n) => n.isNew).length;

	const profiles = [
		{ id: 1, name: "Alex", avatarColor: "#e50914", isKids: false },
		{ id: 2, name: "Kids", avatarColor: "#3b82f6", isKids: true },
		{ id: 3, name: "Guest", avatarColor: "#10b981", isKids: false },
	];

	return (
		<header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
			<div className={styles.container}>
				{/* Mobile Hamburger Button */}
				<button
					className={styles.hamburgerBtn}
					onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					aria-label="Toggle navigation">
					{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
				</button>

				{/* Netflix Logo */}
				<Link to="/" className={styles.logoLink} aria-label="Netflix Home">
					<img className={styles.logo} src={logo} alt="Netflix" />
				</Link>

				{/* Desktop Navigation */}
				<nav className={styles.nav}>
					<NavLink
						to="/"
						onClick={closeMenus}
						className={({ isActive }) =>
							`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
						}
						end>
						Home
					</NavLink>
					<NavLink
						to="/tv-shows"
						onClick={closeMenus}
						className={({ isActive }) =>
							`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
						}>
						TV Shows
					</NavLink>
					<NavLink
						to="/movies"
						onClick={closeMenus}
						className={({ isActive }) =>
							`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
						}>
						Movies
					</NavLink>
					<NavLink
						to="/news-and-popular"
						onClick={closeMenus}
						className={({ isActive }) =>
							`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
						}>
						New & Popular
					</NavLink>
					<NavLink
						to="/my-list"
						onClick={closeMenus}
						className={({ isActive }) =>
							`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
						}>
						My List
						{myList.length > 0 && (
							<span className={styles.listCounter}>{myList.length}</span>
						)}
					</NavLink>
					<NavLink
						to="/browse-by-language"
						onClick={closeMenus}
						className={({ isActive }) =>
							`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
						}>
						Browse by Language
					</NavLink>
				</nav>

				{/* Right Controls */}
				<div className={styles.rightSection}>
					{/* Interactive Live Search */}
					<div className={styles.searchContainer} ref={searchContainerRef}>
						<div
							className={`${styles.searchBox} ${
								isSearchOpen ? styles.searchBoxOpen : ""
							}`}>
							<button
								onClick={handleSearchToggle}
								className={styles.searchButton}
								aria-label="Search">
								<Search size={19} />
							</button>

							<input
								ref={searchInputRef}
								type="text"
								value={searchQuery}
								onChange={(e) => searchMovies(e.target.value)}
								placeholder="Search"
								className={styles.searchInput}
							/>

							{searchQuery && (
								<button
									onClick={() => searchMovies("")}
									className={styles.clearSearchBtn}
									aria-label="Clear search">
									<X size={16} />
								</button>
							)}
						</div>

						{/* Live Search Results Popup */}
						{searchQuery && (
							<div className={styles.searchResultsDropdown}>
								<div className={styles.searchHeader}>
									<span>
										{isSearching
											? "Searching titles..."
											: `Results for "${searchQuery}" (${searchResults.length})`}
									</span>
								</div>

								{searchResults.length === 0 && !isSearching && (
									<div className={styles.noResults}>
										<p>No matching titles found.</p>
										<span>Try searching for movie titles, directors, or genres.</span>
									</div>
								)}

								<div className={styles.searchList}>
									{searchResults.slice(0, 8).map((item) => (
										<div
											key={item.id}
											className={styles.searchResultItem}
											onClick={() => {
												setIsSearchOpen(false);
												searchMovies("");
												openDetail(item);
											}}>
											<div className={styles.searchThumbnail}>
												{item.poster_path || item.localPoster ? (
													<img
														src={
															item.localPoster ||
															(item.poster_path?.startsWith("http")
																? item.poster_path
																: `${TMDB_THUMBNAIL_BASE}${item.poster_path}`)
														}
														alt={item.title || item.name}
													/>
												) : (
													<div className={styles.placeholderThumb}>
														<Film size={18} />
													</div>
												)}
											</div>
											<div className={styles.searchItemDetails}>
												<h4>{item.title || item.name}</h4>
												<div className={styles.searchItemMeta}>
													<span>
														{(
															item.release_date ||
															item.first_air_date ||
															"2024"
														).substring(0, 4)}
													</span>
													<span className={styles.searchItemTag}>
														{item.media_type === "tv" ? "TV Show" : "Movie"}
													</span>
													{item.vote_average && (
														<span className={styles.searchRating}>
															★ {item.vote_average.toFixed(1)}
														</span>
													)}
												</div>
											</div>
											<button
												className={styles.quickPlayBtn}
												onClick={(e) => {
													e.stopPropagation();
													setIsSearchOpen(false);
													searchMovies("");
													playTrailer(item);
												}}
												title="Play Trailer">
												<Play size={14} fill="#000" />
											</button>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Notification Center with Count Badge */}
					<div className={styles.notificationWrapper} ref={notifRef}>
						<button
							onClick={() => setIsNotificationOpen(!isNotificationOpen)}
							className={styles.iconButton}
							aria-label={`Notifications (${unreadCount} unread)`}>
							<Bell size={20} />
							{unreadCount > 0 && (
								<span className={styles.notificationBadge}>{unreadCount}</span>
							)}
						</button>

						{isNotificationOpen && (
							<div className={styles.notificationDropdown}>
								<div className={styles.notifHeader}>
									<h3>Notifications ({unreadCount})</h3>
									{unreadCount > 0 && (
										<button
											onClick={() => {
												setNotifications((prev) =>
													prev.map((item) => ({ ...item, isNew: false }))
												);
												showToast("All notifications marked as read");
											}}>
											Mark all read
										</button>
									)}
								</div>
								<div className={styles.notifList}>
									{notifications.map((n) => (
										<div
											key={n.id}
											className={`${styles.notifItem} ${
												n.isNew ? styles.notifItemNew : ""
											}`}
											onClick={() => {
												setNotifications((prev) =>
													prev.map((item) =>
														item.id === n.id ? { ...item, isNew: false } : item
													)
												);
											}}>
											<div className={styles.notifIconWrap}>
												<Film size={16} />
											</div>
											<div className={styles.notifContent}>
												<div className={styles.notifTitleRow}>
													<h4>{n.title}</h4>
													{n.isNew && <span className={styles.newPill}>NEW</span>}
												</div>
												<p>{n.desc}</p>
												<span className={styles.notifTime}>{n.time}</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* User Profile or Sign In CTA */}
					{currentUser && authToken ? (
						<div className={styles.profileContainer} ref={profileRef}>
							<button
								onClick={() => setIsProfileOpen(!isProfileOpen)}
								className={styles.profileButton}
								aria-label="Profile menu">
								<div
									className={styles.profileAvatar}
									style={{ backgroundColor: currentUser?.avatar_color || "#e50914" }}>
									{currentUser?.avatarImage || currentUser?.avatar_image ? (
										<img
											src={currentUser.avatarImage || currentUser.avatar_image}
											alt={currentUser?.username || "Avatar"}
											className={styles.avatarImg}
										/>
									) : (
										<User size={18} color="#ffffff" />
									)}
								</div>
								<ChevronDown
									size={15}
									className={`${styles.chevron} ${
										isProfileOpen ? styles.chevronOpen : ""
									}`}
								/>
							</button>

							{isProfileOpen && (
								<div className={styles.profileMenu}>
									<div className={styles.profileUserHeader}>
										<div
											className={styles.dropdownAvatarThumb}
											style={{ backgroundColor: currentUser?.avatar_color || "#e50914" }}>
											{currentUser?.avatarImage || currentUser?.avatar_image ? (
												<img
													src={currentUser.avatarImage || currentUser.avatar_image}
													alt={currentUser?.username || "Avatar"}
													className={styles.avatarImg}
												/>
											) : (
												<User size={16} color="#ffffff" />
											)}
										</div>
										<div className={styles.dropdownUserMeta}>
											<span className={styles.profileUserName}>
												{currentUser?.username || "Netflix Member"}
											</span>
											<span className={styles.profileUserEmail}>
												{currentUser?.email || "Signed In"}
											</span>
										</div>
									</div>
									<div className={styles.switchProfilesList}>
										{profiles.map((p) => (
											<button
												key={p.id}
												className={styles.profileMenuItem}
												style={{
													fontWeight: activeProfile?.id === p.id ? "700" : "400",
												}}
												onClick={() => {
													switchProfile(p);
													setIsProfileOpen(false);
												}}>
												<div
													style={{
														width: "22px",
														height: "22px",
														borderRadius: "4px",
														backgroundColor: p.avatarColor,
														display: "inline-flex",
														alignItems: "center",
														justifyContent: "center",
														marginRight: "8px",
														verticalAlign: "middle",
													}}>
													<User size={13} color="#ffffff" />
												</div>
												<span>{p.name}</span>
											</button>
										))}
									</div>
									<hr className={styles.profileMenuDivider} />
									<button
										className={styles.profileMenuItem}
										onClick={() => {
											setIsProfileOpen(false);
											openAccountModal();
										}}>
										<User size={15} style={{ marginRight: "8px", verticalAlign: "middle" }} />
										Account
									</button>
									<button
										className={styles.profileMenuItem}
										onClick={() => {
											showToast("Netflix Help Center: 24/7 customer support active");
											setIsProfileOpen(false);
										}}>
										Help Center
									</button>
									<hr className={styles.profileMenuDivider} />
									<button
										className={`${styles.profileMenuItem} ${styles.signOutBtn}`}
										onClick={() => {
											setIsProfileOpen(false);
											setShowSignOutConfirm(true);
										}}>
										<LogOut size={15} style={{ marginRight: "8px", verticalAlign: "middle" }} />
										Sign Out
									</button>
								</div>
							)}
						</div>
					) : (
						<Link to="/login" className={styles.headerSignInBtn}>
							Sign In
						</Link>
					)}
				</div>
			</div>

			{/* Mobile Drawer Menu */}
			{isMobileMenuOpen && (
				<div className={styles.mobileDrawer}>
					<nav className={styles.mobileNav}>
						<NavLink
							to="/"
							onClick={closeMenus}
							className={({ isActive }) =>
								`${styles.mobileNavLink} ${isActive ? styles.mobileActive : ""}`
							}
							end>
							Home
						</NavLink>
						<NavLink
							to="/tv-shows"
							onClick={closeMenus}
							className={({ isActive }) =>
								`${styles.mobileNavLink} ${isActive ? styles.mobileActive : ""}`
							}
							end={false}>
							TV Shows
						</NavLink>
						<NavLink
							to="/movies"
							onClick={closeMenus}
							className={({ isActive }) =>
								`${styles.mobileNavLink} ${isActive ? styles.mobileActive : ""}`
							}
							end={false}>
							Movies
						</NavLink>
						<NavLink
							to="/news-and-popular"
							onClick={closeMenus}
							className={({ isActive }) =>
								`${styles.mobileNavLink} ${isActive ? styles.mobileActive : ""}`
							}
							end={false}>
							New & Popular
						</NavLink>
						<NavLink
							to="/my-list"
							onClick={closeMenus}
							className={({ isActive }) =>
								`${styles.mobileNavLink} ${isActive ? styles.mobileActive : ""}`
							}
							end={false}>
							My List ({myList.length})
						</NavLink>
						<NavLink
							to="/browse-by-language"
							onClick={closeMenus}
							className={({ isActive }) =>
								`${styles.mobileNavLink} ${isActive ? styles.mobileActive : ""}`
							}
							end={false}>
							Browse by Language
						</NavLink>

						{currentUser && authToken && (
							<>
								<button
									className={styles.mobileAccountBtn}
									onClick={() => {
										closeMenus();
										openAccountModal();
									}}>
									<User size={16} />
									Account Settings
								</button>
								<button
									className={styles.mobileSignOutBtn}
									onClick={() => {
										closeMenus();
										setShowSignOutConfirm(true);
									}}>
									<LogOut size={16} />
									Sign Out
								</button>
							</>
						)}
					</nav>
				</div>
			)}

			{/* Sign Out Confirmation Modal Alert */}
			{showSignOutConfirm && (
				<div
					className={styles.confirmOverlay}
					onClick={() => setShowSignOutConfirm(false)}
					role="dialog"
					aria-modal="true"
					aria-labelledby="sign-out-title">
					<div
						className={styles.confirmBox}
						onClick={(e) => e.stopPropagation()}>
						<button
							className={styles.confirmCloseBtn}
							onClick={() => setShowSignOutConfirm(false)}
							aria-label="Close dialog">
							<X size={20} />
						</button>
						<div className={styles.confirmIconWrap}>
							<LogOut size={26} />
						</div>
						<h3 id="sign-out-title" className={styles.confirmTitle}>
							Sign Out
						</h3>
						<p className={styles.confirmDesc}>
							Are you sure you want to sign out?
						</p>
						<div className={styles.confirmActions}>
							<button
								type="button"
								className={styles.confirmCancelBtn}
								onClick={() => setShowSignOutConfirm(false)}>
								Cancel
							</button>
							<button
								type="button"
								className={styles.confirmSignOutBtn}
								onClick={() => {
									setShowSignOutConfirm(false);
									logoutUser();
									navigate("/login");
								}}>
								Sign Out
							</button>
						</div>
					</div>
				</div>
			)}
		</header>
	);
}

export default Header;
