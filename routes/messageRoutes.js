// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// ✅ 1. Send Message
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, text, type, mediaUrl } = req.body;

    if (!senderId || !receiverId || (!text && !mediaUrl)) {
      return res.status(400).json({ message: "Missing required message content." });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || '',
      type: type || 'text',
      mediaUrl: mediaUrl || ''
    });

    const savedMessage = await newMessage.save();

    // Real-time messaging can be integrated via Socket.IO here
    // Example: io.to(receiverSocketId).emit("receiveMessage", savedMessage);

    res.status(201).json({ message: "Message sent successfully", data: savedMessage });
  } catch (error) {
    console.error("❌ Send message error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ 2. Chat List: Show users I chatted with + last message
router.get('/chatlist/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userId] },
              "$receiverId",
              "$senderId"
            ]
          },
          lastMessage: { $first: "$text" },
          timestamp: { $first: "$createdAt" }
        }
      },
      {
        $project: {
          userId: "$_id",
          lastMessage: 1,
          timestamp: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json(messages);
  } catch (err) {
    console.error("❌ Chat list error:", err.message);
    res.status(500).json({ error: "Failed to fetch chat list" });
  }
});

// ✅ 3. Get All Messages Between Two Users
router.get('/conversation/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error("❌ Conversation fetch error:", err.message);
    res.status(500).json({ message: "Failed to get conversation" });
  }
});
// routes/messageRoutes.js
router.get('/history/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  const msgs = await Message.find({
    $or: [
      { senderId: user1, receiverId: user2 },
      { senderId: user2, receiverId: user1 }
    ]
  }).sort({ createdAt: 1 });
  res.json(msgs);
});

module.exports = router;