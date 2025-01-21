const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Status = require("../../models/status");
const UserProfile = require("../../models/Profile");
const UserDetail = require("../../models/userDetail");

const generateTokens = (userId) => ({
  accessToken: jwt.sign({ userId }, "idea", { expiresIn: "30d" }),

  refreshToken: jwt.sign({ userId }, "idea", { expiresIn: "30d" }),
});

const validateAuthInput = (email, password) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
};



const addStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { PID, points } = req.body;

    const status = await Status.create({
      userId: id,
      panelistID: PID,
      points,
    });

    res.status(201).json({ message: "Status added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteAccount = async (req, res) => {
  const { email } = req.query;
  console.log(email);
  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required for account deletion." });
  }

  try {
    const deletedUser = await UserProfile.destroy({
      where: {
        email: email,
      },
    });
    console.log(deletedUser);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Error deleting account:", error);
    res
      .status(500)
      .json({ error: "Failed to delete account. Please try again later." });
  }
};

// const { UserDetail } = require('./models'); // Adjust the path to where your model is defined

const addData = async (req, res) => {
  try {
    // Extracting data from the request body
    const {
      firebaseInfo,
      token,
      status,
      userId,
      timestamp,
      identities,
      idToken,
      network,
      deviceInfo,
      sessionInfo,
    } = req.body;

    // Saving data to the database
    const userDetail = await UserDetail.create({
      firebaseInfo,
      token,
      status,
      userId,
      timestamp,
      identities,
      idToken,
      network,
      deviceInfo,
      sessionInfo,
    });

    console.log(userDetail);

    // Sending success response
    return res.status(201).json({
      success: true,
      message: "Data added successfully",
      data: userDetail,
    });
  } catch (error) {
    // Sending error response
    console.error("Error saving data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add data",
      error: error.message,
    });
  }
};

const updateRedirectStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { PID } = req.query;

    const pointUpdate = await Status.findOne({ where: { panelistID: PID } });
    await pointUpdate.update({ status });

    if (status === "complete") {
      const point = pointUpdate.points;
      const ProfileUpdate = await UserProfile.findOne({
        where: { id: pointUpdate.userId },
      });
      const availablePoint = ProfileUpdate.point;
      await ProfileUpdate.update({ point: availablePoint + point });

      res.status(200).json({ message: "Points added successfully" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


const getPoint = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const decodedEmail = decodeURIComponent(email);

    // Use findOrCreate to fetch or create the profile
    const profile = await UserProfile.findOne({
      where: { email: decodedEmail },
    });

    console.log(profile);

    // Generate tokens for the profile
    // const tokens = generateTokens(profile.id);

    // if (created) {
    //   console.log("New profile created for:", decodedEmail);
    //   return res.status(201).json({ profile, tokens });
    // }

    

    res.status(200).json({ profile });
  } catch (err) {
    console.error("Error in getProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const decodedEmail = decodeURIComponent(email);

    // Use findOrCreate to fetch or create the profile
    const [profile, created] = await UserProfile.findOrCreate({
      where: { email: decodedEmail },
    });

    console.log(created, profile);

    // Generate tokens for the profile
    const tokens = generateTokens(profile.id);

    if (created) {
      console.log("New profile created for:", decodedEmail);
      return res.status(201).json({ profile, tokens });
    }

    res.status(200).json({ profile, tokens });
  } catch (err) {
    console.error("Error in getProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { profile, email } = req.body;
    const {
      firstName,
      lastName,
      phoneNumber,
      city,
      state,
      country,
      address,
      gender,
      postalCode,
      dateOfBirth,
    } = profile;

    // Filter out null, undefined, and empty string values
    const data = Object.fromEntries(
      Object.entries({
        firstName,
        lastName,
        phoneNumber,
        city,
        state,
        country,
        address,
        gender,
        postalCode,
        dateOfBirth,
      }).filter(([_, value]) => value != null && value !== '') // Exclude null and empty strings
    );

    console.log("Filtered data for update:", data);

    const userProfile = await UserProfile.findOne({ where: { email } });

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    await userProfile.update(data);

    res.status(200).json({ message: "User profile updated successfully" });
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validateAuthInput(email, password);

    const existingUser = await UserProfile.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserProfile.create({
      email,
      password: hashedPassword,
    });

    console.log(newUser);

    const tokens = generateTokens(newUser.id);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      ...tokens,
      email: newUser.email,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again later.",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validateAuthInput(email, password);

    const user = await UserProfile.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const tokens = generateTokens(user.id);

    res.json({
      success: true,
      message: "Login successful",
      ...tokens,
      email: user.email,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again later.",
    });
  }
};

module.exports = {
  addStatus,
  updateRedirectStatus,
  getProfile,
  updateProfile,
  registerUser,
  loginUser,
  deleteAccount,
  addData,
  getPoint
};
