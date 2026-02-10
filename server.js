const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/loginFormDB");

// Schema & Model
const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
});
const User = mongoose.model("User", userSchema);

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "chiranjeevikaamv@gmail.com",   // <-- Replace with admin email
    pass: "jvla rpnc exda anlx",          // <-- Use App Password (not normal Gmail password)
  },
});

// API Route
app.post("/register", async (req, res) => {
  try {
    const { name, age, email } = req.body;

    // Save to MongoDB
    const newUser = new User({ name, age, email });
    await newUser.save();

    // Send Welcome Email
    const mailOptions = {
      from: "chiranjeevikaamv@gmail.com",
      to: email,
      subject: "Welcome to Our App!",
      text: `Hello ${name},\n\nWelcome! We're happy to have you.\n\nRegards,\nVEI TECH PVT LTD`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "User registered and email sent!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error occurred" });
  }
});

// Start server
app.listen(5001, () => {
  console.log("Server running on http://localhost:5001");
});

