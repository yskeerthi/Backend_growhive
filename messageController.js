const Message = require("../models/Message");

// ✅ Send a Message
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, text, type, mediaUrl } = req.body;

  try {
    if (!senderId || !receiverId || (!text && !mediaUrl)) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const newMsg = new Message({
      senderId,
      receiverId,
      text: text || '',
      type: type || 'text',
      mediaUrl: mediaUrl || ''
    });

    await newMsg.save();
    res.status(201).json(newMsg);
  } catch (err) {
    console.error("Send message error:", err.message);
    res.status(500).json({ error: "Message send failed" });
  }
};

// ✅ Get All Messages Between Two Users
exports.getMessages = async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ createdAt: 1 }); // use createdAt instead of timestamp

    res.status(200).json(messages);
  } catch (err) {
    console.error("Get messages error:", err.message);
    res.status(500).json({ error: "Failed to get messages" });
  }
}; 