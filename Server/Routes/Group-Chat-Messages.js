const { 
    fetchAllGroupChatsAndMessages, sendMessage
} = require('../Controllers/Group-Chat-Message.js');
const upload = require('../Services/upload.js');
const express = require('express');
const router = express.Router();

router.post('/send-message', upload.array('media', 4), sendMessage);
router.get('/get-all-group-chats-and-messages', fetchAllGroupChatsAndMessages);
router.get('/get-messages-by-chat/:chat');

router.put('/delete-message-for-me/:messageId');
router.delete('/delete-message-for-everyone/:messageId');
router.patch('/');

module.exports = router;