const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../utils/emailService');


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }


    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }


    const otp = generateOTP();


    await OTP.deleteMany({ email });

  
    const newOTP = new OTP({ email, otp });
    await newOTP.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({ 
      message: 'OTP sent successfully to your email',
      
      ...(process.env.NODE_ENV === 'development' && { otp }) 
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});


router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

  
    await OTP.deleteOne({ email, otp });

    res.status(200).json({ message: 'Email verified successfully' });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        user = new User({ name, email, password });
        await user.save();
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
            message: 'User registered successfully. Please complete your profile.',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};


router.post('/signup', registerUser);

module.exports = router;
