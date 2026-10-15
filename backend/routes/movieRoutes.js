const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");
const { optionalAuthMiddleware } = require("../middleware/auth");

// Movie Preferences & Gemini AI Recommendations
router.post("/preferences", optionalAuthMiddleware, movieController.createMoviePreference);
router.post("/preference", optionalAuthMiddleware, movieController.createMoviePreference);
router.get("/recommendations", optionalAuthMiddleware, movieController.getRecommendations);
router.post("/recommendations", optionalAuthMiddleware, movieController.getRecommendations);

// TMDB Passthroughs & Details
router.get("/trending", movieController.getTrending);
router.get("/details/:id", movieController.getMovieDetails);

module.exports = router;
