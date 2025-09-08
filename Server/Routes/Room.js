const express = require('express');
const { createRoom, joinRoom, getRoomById } = require('../Controllers/Room.js');

const router = express.Router();

router.get('/:roomId', getRoomById);
router.post('/create-room', createRoom);
router.put('/join-room/:sessionId', joinRoom);

module.exports = router;