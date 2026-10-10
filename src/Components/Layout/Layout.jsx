import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import TrailerModal from "../TrailerModal/TrailerModal";
import DetailModal from "../DetailModal/DetailModal";
import AccountModal from "../AccountModal/AccountModal";
import { useMovie } from "../../context/MovieContext";
import styles from "./Layout.module.css";

function Layout() {
	const { toast } = useMovie();

	return (
		<div className={styles.layout}>
			<Header />
			<main className={styles.mainContent}>
				<Outlet />
			</main>
			<Footer />

			{/* Global Modals */}
			<TrailerModal />
			<DetailModal />
			<AccountModal />

			{/* Toast Notification */}
			{toast.show && (
				<div className={styles.toast}>
					<span>{toast.message}</span>
				</div>
			)}
		</div>
	);
}

export default Layout;
