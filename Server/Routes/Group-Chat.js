const express = require("express");
const router = express.Router();
const { createGroupChat, getAllGroupChatsByUser, addGroupChatToFavourites, removeMemberFromGroup,
    removeGroupChatFromFavourites, changeNickname, joinGroup, leaveGroup, addParticipant, deleteGroup
} = require("../Controllers/Group-Chat.js");

router.route("/").post(createGroupChat).get(getAllGroupChatsByUser);

router.put('/join-group/:groupId', joinGroup);
router.put('/leave-group/:groupId', leaveGroup);
router.put('/add-member-to-group', addParticipant);
router.patch('/remove-member-from-group', removeMemberFromGroup);
router.patch('/update-group-member-nickname', changeNickname);
router.patch('/add-group-chat-to-favourites/:chatId', addGroupChatToFavourites);
router.patch('/remove-group-chat-from-favourites/:chatId', removeGroupChatFromFavourites);
router.delete('/:groupId', deleteGroup);

module.exports = router;