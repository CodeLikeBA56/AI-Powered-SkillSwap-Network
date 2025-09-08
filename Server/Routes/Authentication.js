const express = require("express");
const authenticateToken = require("../Services/Auth.js");
const { authenticateUser, logoutUser, verifyUserSession } = require("../Controllers/Authentication.js");

const router = express.Router();

router.post("/logout", logoutUser);
router.post("/authenticate", authenticateUser);
router.post('/verify-user-session/:userId', authenticateToken, verifyUserSession);

module.exports = router; 