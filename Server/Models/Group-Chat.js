const mongoose = require("../Configuration/Mongo-Config.js");

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    profile: { type: mongoose.Schema.Types.ObjectId, default: null },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    description: { type: String, default: null },
    nicknames: { type: Map, of: String, default: {} },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }],
    lastMessage: { type: Map, of: mongoose.Schema.Types.ObjectId, ref: "Group-Messages", default: {} },
    seenBy: { type: Map, of: Boolean, default: {}},
    deleteBy: { type: Map, of: Boolean, default: {}},
    isFavourite: { type: Map, of: Boolean, default: {}},
    hashtags: [{ type: String, index: true, default: [] }],
    visibility: { type: String, enum: ["public", "private", "followers-only"], default: "public" },
  },
  { timestamps: true }
);
groupSchema.index({ participants: 1 });

const groupMessageSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group-Chats", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    content: { type: String },
    attachments: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: "group-chat-media" },
        name: { type: String, required: true },
        type: { type: String, enum: ["image", "video", "document"], required: true }
      }
    ],
    mentions: { type: [mongoose.Schema.Types.ObjectId], ref: "Users", default: [] },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Group-Messages', default: null },
    createdAt: { type: Date, required: true},
    updatedAt: { type: Date, required: true },
    readBy: { type: Map, of: Date, default: {} },
    deliveredTo: { type: Map, of: Date, default: {}},
    deleteBy: { type: Map, of: Boolean, default: {}}
  },
  { timestamps: true }
);
groupMessageSchema.index({ group: 1, createdAt: -1 });

const groupEventSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group-Chats", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }, // Who triggered the event
  target: { type: mongoose.Schema.Types.ObjectId, ref: "Users", default: null },  // Who is affected by the event (if any)
  eventType: { type: String, required: true,
    enum: ['added', 'join', 'left', 'admin_assigned', 'removed', 'nickname_changed'],
  },
  meta: { type: Map, of: String, default: {} },
  createdAt: { type: Date, default: Date.now }
});

groupEventSchema.index({ group: 1, createdAt: -1 });

const GroupChatCollection = mongoose.model("Group-Chats", groupSchema);
const GroupMessageCollection = mongoose.model("Group-Messages", groupMessageSchema);
const GroupEventCollection = mongoose.model("Group-Events", groupEventSchema);

module.exports = { GroupChatCollection, GroupMessageCollection, GroupEventCollection };