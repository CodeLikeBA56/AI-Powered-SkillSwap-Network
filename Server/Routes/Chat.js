const express = require("express");
const router = express.Router();
const { 
    createChat, updateChatName, deleteChat, clearChat,
    getAllChatsByUser, addChatToFavourites, removeChatFromFavourites
} = require("../Controllers/Chat.js");

router.route("/")
    .post(createChat)
    .patch(updateChatName)
    .get(getAllChatsByUser)
    .delete(deleteChat);

router.patch('/clear-chat/:chatId', clearChat);
router.patch('/add-chat-to-favourites/:chatId', addChatToFavourites);
router.patch('/remove-chat-from-favourites/:chatId', removeChatFromFavourites);

module.exports = router;