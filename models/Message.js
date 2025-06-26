// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    receiverId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    text: { 
      type: String, 
      default: '' 
    },
    type: {
      type: String,
      enum: [
        'text',
        'image',
        'voice',
        'audio',
        'document',
        'video'
      ],
      default: 'text'
    },
    mediaUrl: { 
      type: String, 
      default: '' 
    },
    fileName: {
      type: String,
      default: ''
    },
    read: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
