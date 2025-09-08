const mongoose = require("../Configuration/Mongo-Config.js");
const { ChatCollection, MessageCollection } = require('../Models/Chat.js');
const { deleteMultipleMedia } = require("../Services/DeleteFileFromGridFS.js");

const sendMessage = async (req, res) => {
    try {
      const sender = req.userId;
      const { chat, content = "", attachments = [], post = null, session = null, replyTo = null, createdAt, updatedAt, participant } = req.body;

      if (!mongoose.Types.ObjectId.isValid(sender))
        return res.status(400).json({ type: "error", message: "The sender id is invalid."});
      
      if (!mongoose.Types.ObjectId.isValid(chat))
        return res.status(400).json({ type: "error", message: "The chat id is invalid."});
      
      if (replyTo) {
        if (!mongoose.Types.ObjectId.isValid(replyTo))
          return res.status(400).json({ type: "error", message: "The reply message id is invalid."});
      }

      if (!chat || !(content || post || session || attachments.length) || !createdAt || !updatedAt)
        return res.status(400).json({ type: "warning", message: "Chat and message content are missing." });

      const deleteBy = { [sender]: false, [participant]: false };

      const newMessage = new MessageCollection({ chat, sender, content, attachments, post, session, replyTo, createdAt, updatedAt, deleteBy });
      const savedMessage = await newMessage.save();

      const Chat = await ChatCollection.findById(chat);

      Chat.lastMessage.set(sender, savedMessage._id);
      Chat.lastMessage.set(participant, savedMessage._id);
      Chat.seenBy.set(participant, false);
      await Chat.save();

      return res.status(201).json({ message: newMessage });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ type: "error", message: "Failed to send message." });
    }
};

const markAllMessagesAsRead = async (req, res) => {
  try {
    const { chat } = req.body;
    const userId = req.userId;

    if (!chat && !userId)
      return res.status(400).json({ type: "warning", message: "The chat id is required to mark all messages as read." });

    if (mongoose.Types.ObjectId.isValid(sender))
        return res.status(400).json({ type: "error", message: "The sender id is invalid."});
        
    if (mongoose.Types.ObjectId.isValid(chat))
        return res.status(400).json({ type: "error", message: "The chat id is invalid."});

    const result = await MessageCollection.updateMany(
      { chat, sender: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({ type: "success", message: `${result.modifiedCount} messages marked as read.` });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Failed to change messages read status.", error });
  }
};

const fetchMessagesByChat = async (req, res) => {
  try {
    const userId = req.userId;
    const chat = req.params.chat;

    if (!chat)
      return res.status(400).json({ type: "warning", message: "The Chat id is required." });

    if (!mongoose.Types.ObjectId.isValid(chat))
      return res.status(400).json({ type: "error", message: "The chat id is invalid." });

    const messages = await MessageCollection.find({ chat, [`deleteBy.${userId}`]: { $ne: true } })
      .populate("sender", "username")
      .populate("post").populate("post.user", "username profilePicture")
      .populate("session").populate("session.host", "username profilePicture")
      .populate("replyTo", "sender content attachments")
      .populate("replyTo.sender", "username").sort({ createdAt: 1 });

    const groupedMessages = messages.reduce((groups, message) => {
      const key = new Date(message.createdAt).toLocaleDateString('en-GB');
      if (!groups[key])
        groups[key] = [];

      groups[key].push(message);
      return groups;
    }, {});

    return res.status(200).json({ type: "success", chat: groupedMessages });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Failed to fetch messages." });
  }
};  

const fetchAllChatsAndMessages = async (req, res) => {
  try {
    const user = req.userId;
    const userChats = await ChatCollection.find({ participants: user, [`deleteBy.${user}`]: false }).sort({ updatedAt : -1 })
      .populate("participants", "username profilePicture bio offeredSkills desiredSkills").lean();

      const messagesPromises = userChats.map(async chat => {
        const msgId = chat.lastMessage?.[user];
        if (msgId) {
            const message = await MessageCollection.findById(msgId, "content post session createdAt").lean();
            chat.lastMessage = message || null;
        } else {
            chat.lastMessage = null;
        }

        chat.participants = chat.participants.find(p => p._id.toString() !== user.toString())
        return chat;
    });

    const resolvedChats = await Promise.all(messagesPromises);
    const chatIds = userChats.map(chat => chat._id);

    if (!chatIds.length) return res.status(200).json({});

    const messages = await MessageCollection.aggregate([
      { 
        $match: { 
          chat: { $in: chatIds },
          $or: [{ [`deleteBy.${user}`]: { $exists: false } }, { [`deleteBy.${user}`]: false }]
        }
      },
      { // fetch sender information.
        $lookup: {
          from: "users",
          localField: "sender",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, username: 1 } }],
          as: "sender"
        }
      },
      { $unwind: "$sender" },
      { $lookup: { // fetch replied to message information.
          from: "chat-messages", 
          localField: "replyTo", 
          foreignField: "_id",
          pipeline: [
            { // fetch replied to person's information.
              $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                pipeline: [{ $project: { _id: 1, username: 1 } }],
                as: "sender"
              }
            },
            { $unwind: "$sender" },
            { $project: { _id: 1, sender: 1, content: 1, attachments: 1, post: 1, session: 1 } }
          ],
          as: "replyTo"
        }
      },
      { $unwind: { path: "$replyTo", preserveNullAndEmptyArrays: true } },
      { $lookup: { // fetch shared post.
          from: "posts",
          localField: "post",
          foreignField: "_id",
          pipeline: [
            { // fetch post by person's information.
              $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                pipeline: [{ $project: { _id: 1, username: 1, profilePicture: 1 } }],
                as: "user"
              }
            },
            { $unwind: "$user" },
          ],
          as: "post"
        }
      },
      { $unwind: { path: "$post", preserveNullAndEmptyArrays: true } },
      { $lookup: {
          from: "sessions",
          localField: "session",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "host",
                foreignField: "_id",
                pipeline: [{ $project: { _id: 1, username: 1, profilePicture: 1 } }],
                as: "host"
              }
            },
            { $unwind: "$host" },
          ],
          as: "session"
        }
      },
      { $unwind: { path: "$session", preserveNullAndEmptyArrays: true } },
      { $addFields: { dateKey: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } } } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: { chat: "$chat", date: "$dateKey" }, messages: { $push: "$$ROOT" } } },
      { $group: { _id: "$_id.chat", dates: { $push: { k: "$_id.date", v: "$messages" } } } },
      { $project: { _id: 1, messagesByDate: { $arrayToObject: "$dates" } } },
    ]);

    const result = {};
    messages.forEach(chat => result[chat._id] = chat.messagesByDate);

    return res.status(200).json({ userChats: resolvedChats, userChatMessages: result});
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Failed to chats and messages", error });
  }
};

const deleteMessageForMe = async (req, res) => {
  try {
    const user = req.userId;
    const messageId = req.params.messageId;

    if (!messageId)
      return res.status(400).json({ type: "warning", message: "Message ID is missing." });

    if (!mongoose.Types.ObjectId.isValid(user) || !mongoose.Types.ObjectId.isValid(messageId))
      return res.status(400).json({ type: "error", message: "The user or message id is invalid." });

    const message = await MessageCollection.findByIdAndUpdate(
      messageId,
      { $set: { [`deleteBy.${user}`]: true } },
      { new: true }
    );

    if (!message)
      return res.status(404).json({ type: "error", message: "Message not found." });

    const chat = await ChatCollection.findById(message.chat);
    if (!chat)
      return res.status(404).json({ type: "error", message: "Chat not found." });

    const participant = chat.participants.find(p => p.toString() !== user);
    const userDeleted = message.deleteBy.get(user) === true;
    const otherDeleted = message.deleteBy.get(participant) === true;

    if (userDeleted && otherDeleted) {
      await MessageCollection.deleteOne({ _id: messageId });
      if (message?.attachments?.length) {
        const fileIds = message?.attachments?.map(file => file._id)
        await deleteMultipleMedia(fileIds, "group-chat-media");
      }
    }

    let lastMessageByMe = null;
    if (chat.lastMessage?.get(user) == messageId) {
      lastMessageByMe = await fetchLastestVisibleMessageByUser(chat._id, user);
      chat.lastMessage.set(user, lastMessageByMe?._id || null);
    }

    await chat.save();
    return res.status(200).json({ type: "success", message: "Message deleted for me.", lastMessageByMe });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Failed to delete message.", error });
  }
};

const deleteMessageForEveryone = async (req, res) => {
  try {
    const user = req.userId;
    const { messageId } = req.params;

    if (!messageId)
      return res.status(400).json({ type: "warning", message: "Message ID is missing." });

    if (!mongoose.Types.ObjectId.isValid(user) || !mongoose.Types.ObjectId.isValid(messageId))
      return res.status(400).json({ type: "error", message: "The user or message id is invalid." });

    const message = await MessageCollection.findByIdAndDelete(messageId);
    if (!message) return res.status(404).json({ type: "error", message: "Message not found." });

    if (message?.attachments?.length) { // Call delete media route from here.
      const fileIds = message?.attachments?.map(file => file._id)
      await deleteMultipleMedia(fileIds, "group-chat-media");
    }

    const chat = await ChatCollection.findById(message.chat);
    if (!chat)
      return res.status(404).json({ type: "error", message: "Chat not found." });

    const participant = chat.participants.find(p => p.toString() !== user);

    let lastMessageByMe = null;
    let lastMessageByOther = null;
    
    if (chat.lastMessage?.get(user) == messageId) {
      lastMessageByMe = await fetchLastestVisibleMessageByUser(chat._id, user);
      chat.lastMessage.set(user, lastMessageByMe?._id || null);
    }

    if (chat.lastMessage?.get(participant) == messageId) {
      lastMessageByOther = await fetchLastestVisibleMessageByUser(chat._id, participant);
      chat.lastMessage.set(participant, lastMessageByOther?._id || null);
    }

    await chat.save();
    return res.status(200).json({ lastMessageByMe, lastMessageByOther });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Failed to delete message.", error });
  }
};

const fetchLastestVisibleMessageByUser = async (chat, user) => {
  try {
    return await MessageCollection.findOne({ chat, [`deleteBy.${user}`]: { $ne: true } })
      .sort({ createdAt: -1 }).select("_id content createdAt").lean();
  } catch (error) {
    return null;
  }
};

module.exports = { 
  sendMessage, markAllMessagesAsRead, 
  deleteMessageForMe, deleteMessageForEveryone,
  fetchMessagesByChat, fetchAllChatsAndMessages
};