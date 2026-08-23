import { useState } from "react";
import "./App.css";
import Header from "./Components/Header/Header";
import Banner from "./Components/Banner/Banner";
import DisplayRow from "./Components/DisplayRow/DisplayRow";
import Footer from "./Components/Footer/Footer";
// import MovieCard from "./Components/MovieCard/MovieCard";

function App() {
	return (
    <>
      <Header />
      <Banner />
      {/* <MovieCard/> */}
      <DisplayRow />
      <Footer/>
      {/* <TestOne />
<TestTwo/>       */}
		</>
	);
}

export default App;
