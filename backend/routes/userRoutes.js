const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const watchlistController = require("../controllers/watchlistController");
const { authMiddleware } = require("../middleware/auth");

// Authentication Routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.patch("/profile", authMiddleware, authController.updateProfile);

// Watchlist Routes
router.get("/watchlist", authMiddleware, watchlistController.getWatchlist);
router.post("/watchlist", authMiddleware, watchlistController.addToWatchlist);
router.delete("/watchlist/:movieId", authMiddleware, watchlistController.removeFromWatchlist);

module.exports = router;
