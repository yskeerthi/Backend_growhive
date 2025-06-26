const Connection = require('../models/connectionschema');

// Send connection request
exports.sendRequest = async (req, res) => {
  const { fromUserId, toUserId } = req.body;
  // console.log("hfjhf");
  try {
    const connection = new Connection({ fromUserId, toUserId });
    await connection.save();
    res.status(201).json(connection);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Accept request
exports.acceptRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await Connection.findByIdAndUpdate(id, { status: 'accepted' }, { new: true });
    res.json(connection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reject or withdraw request
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'rejected' or 'withdrawn'
  try {
    const connection = await Connection.findByIdAndUpdate(id, { status }, { new: true });
    res.json(connection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all connections for a user
exports.getConnections = async (req, res) => {
  const { userId } = req.params;
  try {
    const connections = await Connection.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ],
      status: 'accepted'
    }).populate('fromUserId toUserId', 'name image education');
    res.json(connections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get pending received requests
exports.getReceivedRequests = async (req, res) => {
  const { userId } = req.params;
  try {
    const requests = await Connection.find({
      toUserId: userId,
      status: 'pending'
    }).populate('fromUserId', 'name image education');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get sent requests
exports.getSentRequests = async (req, res) => {
  const { userId } = req.params;
  try {
    const requests = await Connection.find({
      fromUserId: userId,
      status: 'pending'
    }).populate('toUserId', 'name image education');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




exports.withdraw= async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Find and delete the connection request
    const deletedRequest = await Connection.findByIdAndDelete(requestId);
    
    if (!deletedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.status(200).json({ 
      message: 'Request withdrawn successfully',
      toUserId: deletedRequest.toUserId 
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error withdrawing request' });
  }
};


//Used In Home Page for getting no of connection of user
exports.getConnectionCount = async (req, res) => {
  const { userId } = req.params;

  try {
    const count = await Connection.countDocuments({
      status: 'accepted',
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching connection count:", error);
    res.status(500).json({ message: "Server error" });
  }
};
