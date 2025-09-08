const mongoose = require("../Configuration/Mongo-Config.js");

const chatSchema = new mongoose.Schema(
    {
        nicknames: { type: Map, of: String, default: {} },
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true }],
        lastMessage: { type: Map, of: mongoose.Schema.Types.ObjectId, default: {} },
        seenBy: { type: Map, of: Boolean, default: {}},
        deleteBy: { type: Map, of: Boolean, default: {}}
    },
    { timestamps: true }
);
chatSchema.index({ participants: 1 });

const messageSchema = new mongoose.Schema(
    {
        chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chats", required: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
        content: { type: String },
        attachments: [
            {
              _id: { type: mongoose.Schema.Types.ObjectId, ref: "group-chat-media" },
              name: { type: String, required: true },
              type: { type: String, enum: ["image", "video", "document"], required: true }
            }
        ],
        post: { type: mongoose.Schema.Types.ObjectId, ref: "Posts", default: null },
        session: { type: mongoose.Schema.Types.ObjectId, ref: "Sessions", default: null },
        replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat-Messages', default: null },
        isDelivered: { type: Boolean, default: false },
        isRead: { type: Boolean, default: false },
        deleteBy: { type: Map, of: Boolean, default: {}}
    },
    { timestamps: true }
);
messageSchema.index({ chat: 1, createdAt: -1 });

const ChatCollection = mongoose.model("Chats", chatSchema);
const MessageCollection = mongoose.model("Chat-Messages", messageSchema);

module.exports = { ChatCollection, MessageCollection };