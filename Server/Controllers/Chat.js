const mongoose = require("../Configuration/Mongo-Config.js");
const { ChatCollection, MessageCollection } = require("../Models/Chat.js");
const UserCollection = require("../Models/Users.js")
const { deleteMultipleMedia } = require("../Services/DeleteFileFromGridFS");

const createChat = async (req, res) => {
    try {
        const myUserId = req.userId;
        const { my_nickname, participant_id , participant_nickname} = req.body;

        if (!my_nickname || !participant_nickname || !participant_id)
            return res.status(400).json({ type: "warning", message: "All fields are required." });

        if (!mongoose.Types.ObjectId.isValid(myUserId))
            return res.status(400).json({ type: "error", message: "The user id is invalid."});

        if (!mongoose.Types.ObjectId.isValid(participant_id))
            return res.status(400).json({ type: "error", message: "The participant id is invalid."});

        const participants = [myUserId.toString(), participant_id.toString()].sort();
        
        const existingChat = await ChatCollection.findOne({ participants })
            .populate("participants", "username profilePicture bio offeredSkills desiredSkills");
        
        if (existingChat) {
            existingChat.deleteBy.set(myUserId, false);
            await existingChat.save();

            const msgId = existingChat.lastMessage.get(myUserId);
            if (msgId) {
                const message = await MessageCollection.findById(msgId, "content createdAt").lean();
                existingChat.lastMessage = message || null;
            } else {
                existingChat.lastMessage = null;
            }
            
            existingChat.participants = existingChat.participants.find(p => p._id.toString() !== myUserId.toString())
            console.log(existingChat);
            return res.status(200).json({ chat: existingChat });
        }
        
        const nicknames = {
            [myUserId]: my_nickname,
            [participant_id]: participant_nickname
        }

        const seenBy = { [myUserId]: false, [participant_id]: false }
        const deleteBy = { [myUserId]: false, [participant_id]: false }
        const lastMessage = { [myUserId]: null, [participant_id]: null }

        const newChat = await ChatCollection.create(
            { nicknames, participants, seenBy, lastMessage, deleteBy }
        );

        return res.status(201).json({ type: "success", message: "Chat created successfully!", chat: newChat });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal server error!" });
    }
};

const getAllChatsByUser = async (req, res) => {
    try {
        const user = req.userId;

        if (!user)
            return res.status(400).json({ type: "warning", message: "User ID is required." });

        const chats = await ChatCollection.find({ participants: user }).sort({ updatedAt: -1 })
            .populate("participants", "username profilePicture bio offeredSkills desiredSkills")
            .lean();
          
        const messagesPromises = chats.map(async chat => {
            const msgId = chat.lastMessage?.[user];
            if (msgId) {
                const message = await MessageCollection.findById(msgId, "content createdAt").lean();
                chat.lastMessage = message || null;
            } else {
                chat.lastMessage = null;
            }

            chat.participants = chat.participants.find(p => p._id.toString() !== user.toString())
            return chat;
        });

        const resolvedChats = await Promise.all(messagesPromises);

        return res.status(200).json({ type: "success", message: "All Chats retrieved successfully!", chats: resolvedChats });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Failed to fetch chats." });
    }
};

const updateChatName = async (req, res) => {
    try {
        const { chatId, participant, nickname } = req.body;

        if (!chatId || !participant || !nickname)
            return res.status(400).json({ type: "warning", message: "Chat ID, User ID, and nickname are required." });

        const chat = await ChatCollection.findById(chatId);
        if (!chat)
            return res.status(404).json({ type: "error", message: "Chat not found." });

        chat.nicknames.set(participant, nickname);
        await chat.save();

        return res.status(200).json({ type: "info", message: "Chat nickname updated successfully!" });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Failed to update chat nickname." });
    }
};

const clearChat = async (req, res) => {
    try {
        const user = req.userId;
        const { chatId } = req.params;
        const { participant } = req.body;

        if (!chatId)
            return res.status(400).json({ type: "warning", message: "The chat id is missing." });
        if (!participant)
            return res.status(400).json({ type: "warning", message: "The participant id is missing." });

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid."});
        if (!mongoose.Types.ObjectId.isValid(participant))
            return res.status(400).json({ type: "error", message: "The participant id is invalid."});
        if (!mongoose.Types.ObjectId.isValid(chatId))
            return res.status(400).json({ type: "error", message: "The chat id is invalid."});

        await clearChatMessages(chatId, user, participant);

        return res.status(200).json({ type: "success", message: "Chat messages cleared successfully!" });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Failed to delete chat." });
    }
};

const deleteChat = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId, participant } = req.body;
    
        if (!chatId)
            return res.status(400).json({ type: "warning", message: "The chat ID is missing." });

        if (!mongoose.Types.ObjectId.isValid(chatId))
            return res.status(400).json({ type: "warning", message: "The chat ID is invalid." });
    
        if (!mongoose.Types.ObjectId.isValid(userId))
            return res.status(400).json({ type: "error", message: "Invalid user ID." });

        const chat = await ChatCollection.findByIdAndUpdate(
            chatId, { $set: { [`deleteBy.${userId}`]: true } }, { new: true }
        );
  
        if (!chat)
            return res.status(404).json({ type: "error", message: "Chat not found." });
    
        await clearChatMessages(chatId, userId, participant);
        await UserCollection.updateOne({ _id: userId }, { $pull: { favouriteChats: chatId } }); // Remove from favourites
      
        if (chat?.deleteBy?.get(participant) === true) { // If both users deleted, remove chat completely
            await ChatCollection.findByIdAndDelete(chatId);
            await MessageCollection.deleteMany({ chat: chatId });
        }

        return res.status(200).json({ type: "success", message: "Chat removed from the list." });
    } catch (error) {
      return res.status(500).json({ type: "info", message: "Something went wrong while deleting your chat. Please refresh and try again." });
    }
};  

const addChatToFavourites = async (req, res) => {
    try {
        const userId = req.userId;
        const chat = req.params.chatId;
    
        if (!userId || !chat)
            return res.status(400).json({ type: "warning", message: "The user and chat ids are missing." });
    
        if (!mongoose.Types.ObjectId.isValid(userId))
            return res.status(400).json({ type: "error", message: "The user id is invalid."});

        if (!mongoose.Types.ObjectId.isValid(chat))
            return res.status(400).json({ type: "error", message: "The chat id is invalid."});
    
        const user = await UserCollection.findById(userId);
    
        if (!user)
            return res.status(404).json({ type: "error", message: "User not found." });
    
        const updatedFavouriteChats = [...user?.favouriteChats];
        if (!updatedFavouriteChats.includes(chat)) {
            updatedFavouriteChats.push(chat);
            user.favouriteChats = updatedFavouriteChats;
        }
    
        await user.save();
        return res.status(200).json({ type: "info", message: `Chat added to the favourites list.` });
    } catch (err) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
};

const removeChatFromFavourites = async (req, res) => {
    try {
        const userId = req.userId;
        const chat = req.params.chatId;
    
        if (!userId || !chat)
            return res.status(400).json({ type: "warning", message: "The user and chat ids are missing." });
    
        if (!mongoose.Types.ObjectId.isValid(userId))
            return res.status(400).json({ type: "error", message: "The user id is invalid."});
    
        if (!mongoose.Types.ObjectId.isValid(chat))
            return res.status(400).json({ type: "error", message: "The chat id is invalid."});
    
        const user = await UserCollection.findById(userId);
    
        if (!user)
            return res.status(404).json({ type: "error", message: "User not found." });
    
        
        if (user?.favouriteChats?.includes(chat)) {
            const updatedFavouriteChats = user?.favouriteChats?.filter(c => c.toString() !== chat);
            user.favouriteChats = updatedFavouriteChats;
        }
    
        await user.save();
        return res.status(200).json({ type: "info", message: `Chat removed from the favourites list.` });
    } catch (err) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
};

const clearChatMessages = async (chatId, userId, participantId) => {
    try {
        await MessageCollection.updateMany( // Step 4: Mark messages as deleted by the current user
            { chat: chatId }, { $set: { [`deleteBy.${userId}`]: true } }
        );

        const messages = await MessageCollection.find({ // Step 1: Fetch all messages in the chat
            chat: chatId,
            $or: [{ [`deleteBy.${userId}`]: true }, { [`deleteBy.${participantId}`]: true }]
          });
          
        const fileIdsToDelete = []; // Step 2: Extract file IDs to delete if both participants have deleted

        for (const message of messages) {
            const isDeletedByUser = message.deleteBy?.get(userId);
            const isDeletedByParticipant = message.deleteBy?.get(participantId);
    
            if (isDeletedByUser && isDeletedByParticipant && message.attachments && message.attachments?.length) {
            const ids = message.attachments.map(file => file._id);
            fileIdsToDelete.push(...ids);
            }
        }

      console.log(fileIdsToDelete)
      if (fileIdsToDelete.length > 0) // Step 3: Delete attachments from GridFS if any
        await deleteMultipleMedia(fileIdsToDelete, "group-chat-media");
  
      await MessageCollection.deleteMany({ // Step 5: Delete messages that are deleted by both users
        chat: chatId,
        [`deleteBy.${userId}`]: true,
        [`deleteBy.${participantId}`]: true,
      });
  
      // Step 6: Reset last message for the user
      await ChatCollection.findByIdAndUpdate(chatId, { [`lastMessage.${userId}`]: null });
    } catch (error) {
      console.error("Clear Chat Messages Error:", error);
    }
}; 

module.exports = { 
    createChat, getAllChatsByUser, updateChatName, clearChat,
    deleteChat, addChatToFavourites, removeChatFromFavourites
};