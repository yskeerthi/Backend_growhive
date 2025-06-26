const express = require('express');
const router = express.Router();

const {
  registerUser,
  completeProfile,
  authUser,
  send,
  verify,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// ✅ Correctly import User model (this was WRONG before)
const User = require('../models/User'); // ✅ FIXED: was wrongly importing Message
const {
  userskill,
  skillsowned,
  all,
  getCompleteUserInfo,
  getUserProfile,
} = require("../controllers/HomePageCon");
// 🔓 Public routes
router.post('/signup', registerUser);
router.post('/login', authUser);
router.post('/send', send);
router.post('/verify', verify);

//hopmepage routes
//Home Screen Api's
router.get("/user-learning-domains/:userId", userskill);
router.post("/domain-experts/:domainName", skillsowned);
// 🔒 Protected routes
router.put('/complete-profile', protect, completeProfile);
//domain inner page
router.get("/profile/:id", getUserProfile);
// ✅ Get all users except the current one
router.get('/all-users/:id', async (req, res) => {
  try {
    const currentUserId = req.params.id;

    // ✅ Get all users except the current one
    const users = await User.find({ _id: { $ne: currentUserId } }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});




module.exports = router;