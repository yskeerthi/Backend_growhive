const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const OTP = require('../models/OtpSchema');
const { sendOTPEmail } = require('../utlis/emailrel');

// ✅ Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ JWT token generator
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// ✅ Send OTP to email
exports.send = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const otp = generateOTP();

    await OTP.deleteMany({ email }); // clear previous
    await new OTP({ email, otp }).save(); // save new

    await sendOTPEmail(email, otp); // send via email

    res.status(200).json({
      message: 'OTP sent successfully to your email',
      ...(process.env.NODE_ENV === 'development' && { otp }), // for testing
    });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// ✅ Verify OTP
exports.verify = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const record = await OTP.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });

    await OTP.deleteOne({ email, otp });
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

// ✅ Register new user
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

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
    console.error('Register error:', error.message);
    res.status(500).send('Server error during registration');
  }
};

// ✅ Login
exports.authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      education: user.education,
      university: user.university,
      location: user.location,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      skillsOwned: user.skillsOwned,
      skillsToLearn: user.skillsToLearn,
      domain: user.domain,
      workLinks: user.workLinks,
      achievements: user.achievements,
      certificates: user.certificates,
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).send('Server error during login');
  }
};

// ✅ Complete Profile
exports.completeProfile = async (req, res) => {
  const userId = req.user._id;
  const { skillsOwned, skillsToLearn, domains, ...otherUpdates } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Handle skillsOwned
    if (skillsOwned) {
      if (!Array.isArray(skillsOwned))
        return res.status(400).json({ message: 'skillsOwned must be an array' });

      for (const skill of skillsOwned) {
        if (!skill.skill || !skill.proficiency)
          return res.status(400).json({ message: 'Each skill must have skill & proficiency' });

        if (!['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(skill.proficiency)) {
          return res.status(400).json({ message: 'Invalid proficiency level' });
        }
      }

      user.skillsOwned = skillsOwned;
    }

    // Handle skillsToLearn
    if (skillsToLearn) {
      if (!Array.isArray(skillsToLearn))
        return res.status(400).json({ message: 'skillsToLearn must be an array' });

      for (const skill of skillsToLearn) {
        if (!skill.skill) return res.status(400).json({ message: 'Each skill must have a skill name' });
      }

      user.skillsToLearn = skillsToLearn;
    }

    // Handle domains
    if (domains) {
      if (!Array.isArray(domains)) return res.status(400).json({ message: 'domains must be an array' });

      const validDomains = [
        'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Cybersecurity',
        'Web Development', 'Mobile Development', 'Blockchain', 'Game Development',
        'UI/UX Design', 'Cloud Computing', 'DevOps', 'Software Engineering',
        'Database Management', 'Network Administration', 'Digital Marketing',
        'Project Management', 'Quality Assurance', 'Data Analysis', 'Business Intelligence'
      ];

      for (const domain of domains) {
        if (!validDomains.includes(domain))
          return res.status(400).json({ message: `Invalid domain: ${domain}` });
      }

      user.domains = domains;
    }

    // Other allowed fields
    for (const key in otherUpdates) {
      if (
        Object.hasOwnProperty.call(otherUpdates, key) &&
        Object.hasOwnProperty.call(user.schema.paths, key) &&
        !['password', 'id', 'createdAt', '__v'].includes(key)
      ) {
        user[key] = otherUpdates[key];
      }
    }

    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      education: user.education,
      university: user.university,
      location: user.location,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      skillsOwned: user.skillsOwned,
      skillsToLearn: user.skillsToLearn,
      domains: user.domains,
      workLinks: user.workLinks,
      achievements: user.achievements,
      certificates: user.certificates,
      profileImageUrl: user.profileImageUrl,
      isVerified: user.isVerified,
      message: 'Profile updated successfully!',
    });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ message: 'Server error during profile update' });
  }
};

// ✅ Get profile (for logged-in user)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).send('Server error fetching profile');
  }
};
