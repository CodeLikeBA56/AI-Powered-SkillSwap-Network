const express = require('express');
const upload = require('../Services/upload.js');
const { initialiseUserProgress, calculateUserProgress, fetchUserProgress, fetchUserProgressById } = require('../Controllers/UserProgress.js');

const router = express.Router();

router.route('/').post(initialiseUserProgress).get(calculateUserProgress, fetchUserProgress);
router.route('/:userId').get(calculateUserProgress, fetchUserProgressById);

module.exports = router;