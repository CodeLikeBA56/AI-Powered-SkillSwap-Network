const express = require('express');
const router = express.Router();
const { addAchievement, getAllAchievements, updateUserAchievements, calculateAllUsersAchievements, getLeaderboardStats } = require('../Controllers/Achievement.js');

router.route('/').post(addAchievement).get(getAllAchievements);

router.put("/update-user-completed-achievements", updateUserAchievements);
router.get("/get-leaderboard-stats", calculateAllUsersAchievements, getLeaderboardStats)

module.exports = router;
