const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const QRCode = require('qrcode');
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");




const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/loginFormDB")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.log("MongoDB not available, continuing without database:", err.message);
  });

// Schema & Model
const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
});
const User = mongoose.model("User", userSchema);

// Ticket schema for bookings
const ticketSchema = new mongoose.Schema({
  name: String,
  from: String,
  to: String,
  date: String,
  time: String,
  price: Number,
  passengers: Number,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});
const Ticket = mongoose.model('Ticket', ticketSchema);

// Nodemailer Transporter (only initialize if SMTP credentials are provided via env)
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
} else {
  console.log('Nodemailer transporter not configured; email sending disabled.');
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/index1.html", (req, res) => {
  res.sendFile(path.join(__dirname, "index1.html"));
});

// API Route
app.post("/register", async (req, res) => {
  try {
    // Expect booking payload: name, from, to, date, time, price, passengers, (optional) email
    const { name, from, to, date, time, price, passengers, email } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database unavailable. Please start MongoDB." });
    }

    // Save booking to MongoDB tickets collection
    const newTicket = new Ticket({ name, from, to, date, time, price: Number(price || 0), passengers: Number(passengers || 1) });
    await newTicket.save();

    // Generate a QR code (data URL) containing ticket id and minimal booking info
    const qrPayload = {
      id: newTicket._id.toString(),
      name,
      from,
      to,
      date,
      time
    };
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));

    // (Optional) send confirmation email with QR attached - disabled by default for dev
    // If you want email sending, configure transporter auth and uncomment below.
    // const mailOptions = { from: 'no-reply@example.com', to: email, subject: 'Booking confirmation', text: 'Your booking', attachments: [{ filename: 'ticket.png', content: qrDataUrl.split(',')[1], encoding: 'base64' }] };
    // await transporter.sendMail(mailOptions);

    res.json({ message: "Booking saved", ticketId: newTicket._id, qr: qrDataUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error occurred" });
  }
});

// Admin routes / API
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tickets/:id', async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const updates = req.body;
    const t = await Ticket.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
