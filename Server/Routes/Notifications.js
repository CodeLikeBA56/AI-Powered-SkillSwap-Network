const express = require("express");
const router = express.Router();
const { 
    getNotificationsByUserId, sendSessionInitiationNotifications, markNotificationAsRead
} = require("../Controllers/Notification");

router.get("/", getNotificationsByUserId);
router.patch("/mark-as-read/:notificationId", markNotificationAsRead);
router.post("/notify-interested-users-for-session", sendSessionInitiationNotifications);

module.exports = router;