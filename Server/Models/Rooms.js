const mongoose = require('../Configuration/Mongo-Config.js');

const roomSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Sessions', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rooms', roomSchema);