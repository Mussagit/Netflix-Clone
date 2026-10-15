import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MovieProvider, useMovie } from "./context/MovieContext";
import Layout from "./Components/Layout/Layout";

// Pages
import Home from "./pages/Home/Home";
import TvShows from "./pages/TvShows/TvShows";
import Movies from "./pages/Movies/Movies";
import NewsAndPopular from "./pages/NewsAndPopular/NewsAndPopular";
import MyList from "./pages/MyList/MyList";
import BrowseByLanguage from "./pages/BrowseByLanguage/BrowseByLanguage";
import Login from "./pages/Login/Login";
import NotFound from "./pages/NotFound/NotFound";

import "./App.css";

// Route protection: Unauthenticated users are sent directly to /login
function ProtectedRoute({ children }) {
	const { currentUser, authToken } = useMovie();
	if (!currentUser || !authToken) {
		return <Navigate to="/login" replace />;
	}
	return children;
}

// Redirect already authenticated users from login page to home
function PublicRoute({ children }) {
	const { currentUser, authToken } = useMovie();
	if (currentUser && authToken) {
		return <Navigate to="/" replace />;
	}
	return children;
}

function AppContent() {
	return (
		<Routes>
			{/* Login & Sign-Up Routes */}
			<Route
				path="/login"
				element={
					<PublicRoute>
						<Login />
					</PublicRoute>
				}
			/>
			<Route path="/signin" element={<Navigate to="/login" replace />} />
			<Route
				path="/signup"
				element={
					<PublicRoute>
						<Login />
					</PublicRoute>
				}
			/>

			{/* Protected App Routes: Requires Sign In / Account Creation */}
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<Layout />
					</ProtectedRoute>
				}>
				<Route index element={<Home />} />
				<Route path="tv-shows" element={<TvShows />} />
				<Route path="tv" element={<Navigate to="/tv-shows" replace />} />
				<Route path="movies" element={<Movies />} />
				<Route path="news-and-popular" element={<NewsAndPopular />} />
				<Route path="latest" element={<Navigate to="/news-and-popular" replace />} />
				<Route path="my-list" element={<MyList />} />
				<Route path="browse-by-language" element={<BrowseByLanguage />} />
			</Route>

			{/* 404 Not Found */}
			<Route path="*" element={<NotFound />} />
		</Routes>
	);
}

function App() {
	return (
		<MovieProvider>
			<AppContent />
		</MovieProvider>
	);
}

export default App;
