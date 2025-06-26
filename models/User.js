const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Non-binary", "Prefer not to say", null],
    default: null,
  },
  education: {
    type: String,
    default: null,
  },
  university: {
    type: String,
    default: null,
  },
  location: {
    type: String,
    default: null,
  },
  phoneNumber: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: null,
    maxlength: 500,
  },
  skillsOwned: {
    type: [
      {
        skill: { type: String, required: true },
        proficiency: {
          type: String,
          enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
          required: true,
        },
        domain: { type: String, required: true },
      },
    ],
    default: [],
  },
  skillsToLearn: {
    type: [
      {
        skill: { type: String, required: true },
        domain: { type: String, required: true },
      },
    ],
    default: [],
  },
  domains: {
    type: [
      {
        type: String,
        enum: [
          "Artificial Intelligence",
          "Machine Learning",
          "Data Science",
          "Cybersecurity",
          "Web Development",
          "Mobile Development",
          "Blockchain",
          "Game Development",
          "UI/UX Design",
          "Cloud Computing",
          "DevOps",
          "Software Engineering",
          "Database Management",
          "Network Administration",
          "Digital Marketing",
          "Project Management",
          "Quality Assurance",
          "Data Analysis",
          "Business Intelligence",
        ],
      },
    ],
    default: [],
  },
  workLinks: {
    type: String,
    default: null,
  },
  achievements: {
    type: String,
    default: null,
  },
  certificates: {
    type: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  profileImageUrl: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    validate: {
      validator: function (value) {
        return value >= 0 && value <= 5;
      },
      message: "Rating must be between 0 and 5",
    },
  },
  serviceNowPosted: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
