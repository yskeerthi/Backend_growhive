const User = require("../models/User");
const Connection = require("../models/connectionschema");


exports.getAllUsers = async (req, res) => {
  const { currentUserId } = req.query;
  try {
    const users = await User.find({ _id: { $ne: currentUserId } }).select("-password");
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error while fetching users" });
  }
};







exports.try = async (req, res) => {
  const { fromUserId } = req.body;

  if (!fromUserId) {
    return res.status(400).json({ message: "Missing fromUserId in request body" });
  }

  try {
    // Get all users except the current user
    const users = await User.find({ _id: { $ne: fromUserId } }).select("-password");

    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        // Check if a connection exists either way
        const connection = await Connection.findOne({
          $or: [
            { fromUserId: fromUserId, toUserId: user._id },
            { fromUserId: user._id, toUserId: fromUserId },
          ],
        });

        return {
          ...user.toObject(),
          connectionStatus: connection ? connection.status : "not_connected",
        };
      })
    );

    res.status(200).json(enhancedUsers);
  } catch (err) {
    console.error("Error fetching users with connection info:", err);
    res.status(500).json({ message: "Server error while fetching users" });
  }
};

