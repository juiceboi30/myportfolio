require("dotenv").config({ path: "./.env" });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("PORT:", process.env.PORT);

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// ✅ Middleware
// ======================
app.use(cors({
  origin: "*", // later you can restrict this to your frontend domain
}));
app.use(express.json());

// ======================
// MongoDB Atlas Connection
// ======================

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing!");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Atlas Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// ======================
// ✅ Schema + Model
// ======================
const MessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model("Message", MessageSchema);

// ======================
// ✅ Routes
// ======================

// Health check route
app.get("/", (req, res) => {
  res.send("🚀 Server is running");
});

// 📩 Save contact message
app.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // ✅ validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required"
      });
    }

    const newMessage = new Message({
      name,
      email,
      message
    });

    await newMessage.save();

    res.status(200).json({
      success: true,
      msg: "✅ Message saved successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "❌ Server error"
    });
  }
});

// 📥 (Optional) Get all messages
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch {
    res.status(500).json({ msg: "Error fetching messages" });
  }
});

// ======================
// ✅ Start Server
// ======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
