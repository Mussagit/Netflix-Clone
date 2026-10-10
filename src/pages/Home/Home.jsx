import React from "react";
import Banner from "../../Components/Banner/Banner";
import DisplayRow from "../../Components/DisplayRow/DisplayRow";
import requests from "../../Utility/requestUrls";
import styles from "./Home.module.css";

function Home() {
	return (
		<div className={styles.homeContainer}>
			<Banner categoryUrl={requests.fetchNetflixOriginals} />
			<DisplayRow />
		</div>
	);
}

export default Home;
