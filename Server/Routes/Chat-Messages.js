const { 
    sendMessage, markAllMessagesAsRead, 
    deleteMessageForMe, deleteMessageForEveryone,
    fetchMessagesByChat, fetchAllChatsAndMessages
} = require('../Controllers/Chat-Message.js');
const upload = require('../Services/upload.js');
const express = require('express');
const router = express.Router();

router.post('/send-message', upload.array('media', 4), sendMessage);
router.get('/get-all-chats-and-messages', fetchAllChatsAndMessages);
router.get('/get-messages-by-chat/:chat', fetchMessagesByChat);

router.put('/delete-message-for-me/:messageId', deleteMessageForMe);
router.delete('/delete-message-for-everyone/:messageId', deleteMessageForEveryone);
router.patch('/', markAllMessagesAsRead);

module.exports = router;