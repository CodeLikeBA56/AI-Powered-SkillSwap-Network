const mongoose = require("../Configuration/Mongo-Config.js");
const { } = require('mongoose');
const { GroupChatCollection, GroupMessageCollection, GroupEventCollection } = require("../Models/Group-Chat.js");
const UserCollection = require("../Models/Users.js");

const sendMessage = async (req, res) => {
  try {
    const sender = req.userId;
    const { group, content, attachments = [], post = null, session = null, replyTo, mentions = [], createdAt, updatedAt, participants } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sender))
      return res.status(400).json({ type: "error", message: "The sender id is invalid."});
    
    if (!mongoose.Types.ObjectId.isValid(group))
      return res.status(400).json({ type: "error", message: "The chat id is invalid."});

    if (replyTo) {
      if (!mongoose.Types.ObjectId.isValid(replyTo))
        return res.status(400).json({ type: "error", message: "The reply message id is invalid."});
    }

    if (!group || !(content || post || session || attachments.length) || !createdAt || !updatedAt)
    return res.status(400).json({ type: "warning", message: "Chat and message content are missing." });
  
  const newMessage = new GroupMessageCollection({ group, sender, content, replyTo, attachments, mentions, createdAt, updatedAt });
    const savedMessage = await newMessage.save();

    const chat = await GroupChatCollection.findById(group);
    if (!chat)
      return res.status(404).json({ type: "error", message: "Group chat not found." })

    const peopleToUpdate = new Set([...participants, sender.toString()]);
    peopleToUpdate.forEach(uid => {
      chat.lastMessage.set(uid, savedMessage._id);
      chat.seenBy.set(uid, uid === sender.toString());
    });
    
    await chat.save();
    return res.status(201).json({ message: newMessage, seenBy: chat.seenBy });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Failed to send message." });
  }
};

const fetchAllGroupChatsAndMessages = async (req, res) => {
  try {
    const user = req.userId;
    
    const userGroupChats = await GroupChatCollection.find(
        { 
          participants: user.toString(), 
          $or: [
            { [`deleteBy.${user}`]: { $exists: false} },
            { [`deleteBy.${user}`]: false }
          ] 
        }
        ).sort({ updatedAt: -1 }).populate("admin", "username profilePicture")
        .populate("participants", "username profilePicture").lean();

    const chatsWithLastMessage = await Promise.all(userGroupChats.map(async chat => {
      const lastMsgId = chat.lastMessage?.[user] || null;

      if (lastMsgId) {
        const message = await GroupMessageCollection.findById(lastMsgId, "sender content createdAt")
          .populate("sender", "username").lean();
        chat.lastMessage = message || null;
      } else
        chat.lastMessage = null;

      return chat;
    }));

    const groupChatIds = chatsWithLastMessage.map(chat => chat._id);
    if (!groupChatIds.length) return res.status(200).json({});

    const messages = await GroupMessageCollection.aggregate([
      {
        $match: {
          group: { $in: groupChatIds },
          $or: [
            { [`deleteBy.${user}`]: { $exists: false } },
            { [`deleteBy.${user}`]: false }
          ]
        }
      },
      {
        $addFields: {
          type: 'message',
          dateKey: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "sender",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, username: 1 } }],
          as: "sender"
        }
      },
      { $unwind: "$sender" },
      {
        $lookup: {
          from: "group-messages",
          localField: "replyTo",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                pipeline: [{ $project: { _id: 1, username: 1 } }],
                as: "sender"
              }
            },
            { $unwind: "$sender" },
            { $project: { _id: 1, sender: 1, content: 1} }
          ],
          as: "replyTo"
        }
      },
      { $unwind: { path: "$replyTo", preserveNullAndEmptyArrays: true } },
      {
        $unionWith: {
          coll: "group-events",
          pipeline: [
            {
              $match: { group: { $in: groupChatIds } }
            },
            {
              $addFields: {
                type: 'event',
                dateKey: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } }
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                pipeline: [{ $project: { _id: 1, username: 1 } }],
                as: "sender"
              }
            },
            { $unwind: "$sender" },
            {
              $lookup: {
                from: "users",
                localField: "target",
                foreignField: "_id",
                pipeline: [{ $project: { _id: 1, username: 1 } }],
                as: "target"
              }
            },
            { $unwind: { path: "$target", preserveNullAndEmptyArrays: true } }
          ]
        }
      },
      { $sort: { group: 1, createdAt: 1 } },
      {
        $group: {
          _id: { group: "$group", date: "$dateKey" },
          items: { $push: "$$ROOT" }
        }
      },
      {
        $group: {
          _id: "$_id.group",
          dates: { $push: { k: "$_id.date", v: "$items" } }
        }
      },
      {
        $project: { _id: 1, mergedTimeline: { $arrayToObject: "$dates" } }
      }
    ]);

    const result = {};
    messages.forEach(chat => result[chat._id] = chat.mergedTimeline);

    return res.status(200).json({ userGroupChats: chatsWithLastMessage, messages: result });

  } catch (error) {
    return res.status(500).json({ type: "error", message: "Failed to fetch group chats and messages", error });
  }
};

module.exports = { fetchAllGroupChatsAndMessages, sendMessage };