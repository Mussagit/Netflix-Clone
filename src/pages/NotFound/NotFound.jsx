import React from "react";
import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

function NotFound() {
	return (
		<div className={styles.notFoundContainer}>
			<div className={styles.overlay}>
				<div className={styles.content}>
					<h1 className={styles.title}>Lost your way?</h1>
					<p className={styles.message}>
						Sorry, we can't find that page. You'll find lots to explore on the
						home page.
					</p>
					<Link to="/" className={styles.homeBtn}>
						Netflix Home
					</Link>
					<div className={styles.errorCode}>
						<span>Error Code </span>
						<strong>NSES-404</strong>
					</div>
				</div>
			</div>
		</div>
	);
}

export default NotFound;
