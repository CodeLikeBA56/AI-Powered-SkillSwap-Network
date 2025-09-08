const mongoose = require('mongoose');
const CommentSchema = require('./Comment.js');

const viewerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  joinedAt: { type: Date, default: Date.now },
  allowJoinDirectly: { type: Boolean, default: false },
});

const attendeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  isHost: { type: Boolean, default: false },
  isLeft: { type: Boolean, default: false },
  isCoHost: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  isMicOn: { type: Boolean, default: false },
  isCameraOn: { type: Boolean, default: false },
  isPresenting: { type: Boolean, default: false },
  kickedByHost: { type: Boolean, default: false },
  approvedByHost: { type: Boolean, default: false },
  approvedRecording: { type: Boolean, default: false }, // if they allow their presence in recording
  presentDuringRecording: { type: Boolean, default: false },
});

const sessionSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  actualStartTime: { type: Date, default: null },
  interestedUsers: [viewerSchema],
  attendees: [attendeeSchema],
  comments: [CommentSchema],
  isBeingRecorded: { type: Boolean, default: false },
  isSessionClosed: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
  recordingUrl: { type: mongoose.Schema.Types.ObjectId, default: null },
  hashtags: [{ type: String }],
  sharedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sessions', sessionSchema);