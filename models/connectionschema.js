const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Better indexes
connectionSchema.index({ fromUserId: 1, status: 1 });
connectionSchema.index({ toUserId: 1, status: 1 });
connectionSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

// Pre-save middleware to prevent bidirectional duplicates
connectionSchema.pre("save", async function (next) {
  if (this.isNew) {
    const existing = await this.constructor.findOne({
      $or: [
        { fromUserId: this.fromUserId, toUserId: this.toUserId },
        { fromUserId: this.toUserId, toUserId: this.fromUserId },
      ],
    });

    if (existing) {
      const error = new Error("Connection already exists");
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Connection", connectionSchema);
