const axios = require("axios");
const User = require("../models/User"); // Update path as needed

const SERVICE_NOW_INSTANCE_URL = "https://dev210958.service-now.com";
const SERVICE_NOW_USERNAME = "saibhanu";
const SERVICE_NOW_PASSWORD = "22A91A05k0@2003"; // ideally store in .env

exports.postUserToServiceNow = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.serviceNowPosted) {
      return res.status(200).json({ message: "Already posted to ServiceNow" });
    }

    const payload = {
      name: user.name,
      email: user.email,
      mobile: user.phoneNumber,
      mongoid: user._id,
    };

    await axios.post(
      `${SERVICE_NOW_INSTANCE_URL}/api/now/table/x_1745159_studen_0_logindata`,
      payload,
      {
        auth: {
          username: SERVICE_NOW_USERNAME,
          password: SERVICE_NOW_PASSWORD,
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    user.serviceNowPosted = true;
    await user.save();

    return res.status(200).json({ message: "User posted successfully" });
  } catch (error) {
    console.error("ServiceNow post error:", error.response?.data || error.message);
    return res.status(500).json({ message: "Failed to post to ServiceNow" });
  }
};
