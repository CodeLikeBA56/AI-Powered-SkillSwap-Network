const { GroupChatCollection, GroupMessageCollection, GroupEventCollection } = require("../Models/Group-Chat.js");
const { getSocketId } = require("../Services/OnlineUsers.js");
const mongoose = require("../Configuration/Mongo-Config.js");
const UserCollection = require("../Models/Users.js");
const { io } = require("../Configuration/Socket.js");

const createGroupChat = async (req, res) => {
  try {
    const myUserId = req.userId;
    const groupData = req.body;

    if (!mongoose.Types.ObjectId.isValid(myUserId))
      return res.status(400).json({ type: "error", message: "The user id is invalid." });

    if (!groupData.participants.includes(myUserId))
      groupData.participants.push(myUserId);

    const groupChat = await GroupChatCollection.create(groupData); // Create group chat

    // Log 'added' events for all participants except the creator
    const participantIds = groupData.participants.filter(
      id => id.toString() !== myUserId.toString() && mongoose.Types.ObjectId.isValid(id)
    );

    const groupEvents = participantIds.map(userId => ({
      group: groupChat._id,
      sender: myUserId,
      target: userId,
      eventType: 'added',
      meta: { message: `User added to group` }
    }));

    await GroupEventCollection.insertMany(groupEvents);

    groupChat.participants.forEach(memberId => {
      const socketId = getSocketId(memberId.toString());

      if (socketId)
        io.to(socketId).emit("someone-added-you-in-a-group", { newJoinedGroup: groupChat });
    });

    return res.status(201).json({ type: "success", message: "Chat created successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ type: "error", message: "Internal server error!" });
  }
};

const getAllGroupChatsByUser = async (req, res) => {
  try {
      const user = req.userId;

      if (!user)
          return res.status(400).json({ type: "warning", message: "User ID is required." });

      const groupChats = await GroupChatCollection.find({ participants: user }).sort({ updatedAt: -1 })
          .populate("admin", "username profilePicture")
          .populate("participants", "username profilePicture")
          .lean();
        
      const messagesPromises = groupChats.map(async chat => {
          const msgId = chat.lastMessage?.[user];
          if (msgId) {
              const message = await GroupMessageCollection.findById(msgId, "content sender createdAt")
              .populate("sender", "username").lean();
              chat.lastMessage = message || null;
          } else {
              chat.lastMessage = null;
          }

          return chat;
      });

      const resolvedChats = await Promise.all(messagesPromises);

      return res.status(200).json({ type: "success", message: "All Chats retrieved successfully!", groupChats: resolvedChats });
  } catch (error) {
      return res.status(500).json({ type: "error", message: "Failed to fetch chats." });
  }
};

const addGroupChatToFavourites = async (req, res) => {
  const userId = req.userId;
  const { chatId } = req.params;

  try {
    const group = await GroupChatCollection.findById(chatId);

    if (!group)
      return res.status(404).json({ type: 'error', message: 'Group chat not found.' });

    group.isFavourite.set(userId.toString(), true);
    await group.save();

    res.status(200).json({ type: "info", message: `Chat added to the favourites list.` });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal server error!" });
  }
};


const removeGroupChatFromFavourites = async (req, res) => {
  const userId = req.userId;
  const { chatId } = req.params;

  try {
    const group = await GroupChatCollection.findById(chatId);

    if (!group)
      return res.status(404).json({ message: 'Group chat not found.' });

    group.isFavourite.set(userId.toString(), false);
    await group.save();

    res.status(200).json({ type: "info", message: `Chat removed from the favourites list.` });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal server error!" });
  }
};

const addParticipant = async (req, res) => {
  try {
    const adminId = req.userId;
    const { groupId, userIdToAdd, participantName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(adminId) || !mongoose.Types.ObjectId.isValid(userIdToAdd) || !mongoose.Types.ObjectId.isValid(groupId))
      return res.status(400).json({ type: "error", message: "Invalid IDs." });

    const group = await GroupChatCollection.findById(groupId);
    if (!group) return res.status(404).json({ type: "error", message: "Group not found." });

    if (String(group.admin) !== adminId)
      return res.status(403).json({ type: "error", message: "Only the admin can add participants." });

    if (group.participants.includes(userIdToAdd))
      return res.status(200).json({ type: "info", message: "User is already a participant." });

    group.participants.push(userIdToAdd);
    group.nicknames.set(userIdToAdd, participantName);
    group.lastMessage.set(userIdToAdd, null);
    group.seenBy.set(userIdToAdd, false);
    group.deleteBy.set(userIdToAdd, false);
    group.isFavourite.set(userIdToAdd, false);
    await group.save();

    const messageEvent = await generateGroupEvent(adminId, userIdToAdd, groupId, "added", { });
    messageEvent.type = "event";

    const populatedGroup = await getPopulatedGroupById(adminId, groupId);
    const newMember = populatedGroup.participants.find(member => member._id.toString() === userIdToAdd.toString());

    populatedGroup.participants.forEach(member => {
      const socketId = getSocketId(member._id.toString());

      if (socketId && adminId.toString() !== member._id.toString() && member._id.toString() !== userIdToAdd.toString()) {
        io.to(socketId).emit('add-member-to-group', { groupId, newMember });
        io.to(socketId).emit('group-chat-message-event-received', { groupId, messageEvent, nicknames: populatedGroup.nicknames, updatedAt: populatedGroup.updatedAt });
      }

      if (member._id.toString() === userIdToAdd.toString()) {
        io.to(socketId).emit("someone-added-you-in-a-group", { newJoinedGroup: populatedGroup })
      }
    });

    return res.status(200).json({ type: "info", message: `${participantName} added to the group successfully!`, group: populatedGroup, messageEvent });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ type: "error", message: "Internal server error." });
  }
};

const changeNickname = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId, participantId, newNickname } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ type: "error", message: "The user id is invalid." });

    if (!mongoose.Types.ObjectId.isValid(groupId))
      return res.status(400).json({ type: "error", message: "The group id is invalid." });

    const group = await GroupChatCollection.findByIdAndUpdate(groupId, 
      { $set: { [`nicknames.${participantId}`]: newNickname } },
      { new: true }).select('nicknames participants updatedAt');

    if (!group) return res.status(404).json({ type: "error", message: "Group not found." });

    const messageEvent = await generateGroupEvent(userId, participantId, groupId, "nickname_changed", { newNickname });
    messageEvent.type = "event";

    group.participants.forEach(member => {
      const socketId = getSocketId(member.toString());
      if (socketId)
        io.to(socketId).emit('group-chat-message-event-received', { groupId, messageEvent, nicknames: group.nicknames, updatedAt: group.updatedAt })
    });

    return res.status(200).json({ type: "success", message: "Nickname changed successfully!" });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal server error." });
  }
};

const joinGroup = async (req, res) => {
  try {
    const userId = req.userId;
    const { username } = req.body;
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ type: "error", message: "The user id is invalid." });

    if (!mongoose.Types.ObjectId.isValid(groupId))
      return res.status(400).json({ type: "error", message: "The group id is invalid." });

    const group = await GroupChatCollection.findById(groupId);
    if (!group) return res.status(404).json({ type: "error", message: "Group not found." });

    if (group.visibility === "private")
      return res.status(403).json({ type: "error", message: "You cannot join a private group." });

    if (group.participants.includes(userId))
      return res.status(200).json({ type: "info", message: "You are already a member of the group." });

    group.participants.push(userId);
    group.nicknames.set(userId, username);
    group.deleteBy.set(userId, false);
    await group.save();

    const messageEvent = await generateGroupEvent(userId, null, groupId, "join", {});
    messageEvent.type = "event";
    
    const populatedGroup = await getPopulatedGroupById(userId, groupId);
    const newMember = populatedGroup.participants.find(member => member._id.toString() === userId.toString());

    populatedGroup.participants.forEach(member => {
      const socketId = getSocketId(member._id.toString());

      if (socketId && userId.toString() !== member._id.toString()) {
        io.to(socketId).emit('add-member-to-group', { groupId, newMember })
        io.to(socketId).emit('group-chat-message-event-received', { groupId, messageEvent, nicknames: group.nicknames, updatedAt: group.updatedAt });
      }
    });

    return res.status(200).json({ type: "success", message: "Joined the group successfully!", group: populatedGroup, messageEvent });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ type: "error", message: "Internal server error." });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ type: "error", message: "The user id is invalid." });

    if (!mongoose.Types.ObjectId.isValid(groupId))
      return res.status(400).json({ type: "error", message: "The group id is invalid." });

    const group = await GroupChatCollection.findByIdAndUpdate(groupId,
      {
        $pull: { participants: userId },
        $set: { 
          [`seenBy.${userId}`]: false, [`deleteBy.${userId}`]: true, 
          [`isFavourite.${userId}`]: false, [`lastMessage.${userId}`]: null 
        }
      }, { new: true }
    );
    if (!group) return res.status(404).json({ type: "error", message: "Group not found." });

    const messageEvent = await generateGroupEvent(userId, null, groupId, "left", {});
    messageEvent.type = "event";

    group.participants.forEach(member => {
      const socketId = getSocketId(member.toString());

      if (socketId) {
        io.to(socketId).emit('remove-member-from-group', { memberId: userId, groupId });
        io.to(socketId).emit('group-chat-message-event-received', { groupId, messageEvent, nicknames: group.nicknames, updatedAt: group.updatedAt });
      }
    });

    return res.status(200).json({ type: "success", message: "Left the group successfully!" });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal server error." });
  }
};

const removeMemberFromGroup = async (req, res) => {
  try {
    const admin = req.userId;
    const { memberId, groupId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(admin))
      return res.status(400).json({ type: "error", message: "The admin id is invalid." });

    if (!mongoose.Types.ObjectId.isValid(memberId))
      return res.status(400).json({ type: "error", message: "The participant id is invalid." });

    if (!mongoose.Types.ObjectId.isValid(groupId))
      return res.status(400).json({ type: "error", message: "The group id is invalid." });

    const group = await GroupChatCollection.findByIdAndUpdate(groupId,
      {
        $pull: { participants: memberId },
        $set: { 
          [`seenBy.${memberId}`]: false, [`deleteBy.${memberId}`]: true, 
          [`isFavourite.${memberId}`]: false, [`lastMessage.${memberId}`]: null 
        }
      },
      { new: true }
    );
    if (!group) return res.status(404).json({ type: "error", message: "Group not found." });

    const messageEvent = await generateGroupEvent(admin, memberId, groupId, "removed", {});
    messageEvent.type = "event";

    group.participants.forEach(member => {
      const socketId = getSocketId(member.toString());

      if (socketId && admin.toString() !== member.toString()) {
        io.to(socketId).emit('remove-member-from-group', { groupId, memberId });
        io.to(socketId).emit('group-chat-message-event-received', { groupId, messageEvent, nicknames: group.nicknames, updatedAt: group.updatedAt });
      }
    });

    return res.status(200).json({ type: "info", message: "Member removed from the group successfully!" });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ type: "error", message: "Internal server error." });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const admin = req.userId;
    const { groupId } = req.params;

    await GroupEventCollection.deleteMany({ group: groupId });
    await GroupMessageCollection.deleteMany({ group: groupId });
    const group = await GroupChatCollection.findByIdAndDelete(groupId);

    group.participants.forEach(memberId => {
      const socketId = getSocketId(memberId.toString());

      if (memberId.toString() !== group.admin.toString() && socketId)
        io.to(socketId).emit("delete-group", { groupId: group._id });
    });

    return res.status(200).json({ type: "success", message: "Group deleted successfully." });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ type: "error", message: "Internal server error." });
  }
}

const getPopulatedGroupById = async (userId, groupId) => {
  try {
    const populatedGroupChat = await GroupChatCollection.findById(groupId)
      .populate("admin", "username profilePicture")
      .populate("participants", "username profilePicture").lean();
        
      const msgId = populatedGroupChat.lastMessage?.[userId];
      if (msgId) {
        const message = await GroupMessageCollection.findById(msgId, "content sender createdAt").populate("sender", "username").lean();
        populatedGroupChat.lastMessage = message || null;
      } else
        populatedGroupChat.lastMessage = null;

    return populatedGroupChat;
  } catch (error) {
    return null;
  }
}

const generateGroupEvent = async (sender, target, group, eventType, meta) => {
  try {
    const messageEvent = await GroupEventCollection.create({
      group, sender, target, eventType, meta
    });

    const populatedMessageEvent = await GroupEventCollection.findById(messageEvent._id)
      .populate("sender", "username profilePicture")
      .populate("target", "username profilePicture").lean();

    return populatedMessageEvent;
  } catch (error) {
    return null;
  }
}

module.exports = { 
  createGroupChat, getAllGroupChatsByUser, addGroupChatToFavourites, removeMemberFromGroup,
  removeGroupChatFromFavourites, changeNickname, joinGroup, leaveGroup, addParticipant, deleteGroup
};