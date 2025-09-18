// server.js - With payload size limits
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

// Set payload size limits for Vercel compatibility
app.use(express.json({ limit: '10mb' })); // Increased from default 100kb
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Memory Schema
const memorySchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  username: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  image_url: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: { type: [Number], default: [] },
  comments: { 
    type: [{
      userId: { type: Number, required: true },
      username: { type: String, required: true },
      text: { type: String, required: true },
      created_at: { type: Date, default: Date.now }
    }], 
    default: [] 
  },
  created_at: { type: Date, default: Date.now }
});

let Memory;
let isConnected = false;
let connectionError = null;

// MongoDB connection function
async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      connectionError = "MONGODB_URI environment variable not found";
      return;
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    Memory = mongoose.model("Memory", memorySchema);
    isConnected = true;
    connectionError = null;
    console.log("✅ Successfully connected to MongoDB");
    
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    connectionError = error.message;
    isConnected = false;
  }
}

// Health check endpoint
app.get("/api/health", async (req, res) => {
  await connectDB();
  
  res.json({ 
    status: "ok", 
    message: "Server is running",
    database: isConnected ? "connected" : "disconnected",
    mongodb_uri_exists: !!process.env.MONGODB_URI,
    connection_error: connectionError,
    max_payload_size: "10mb"
  });
});

// Get all memories
app.get("/api/memories", async (req, res) => {
  try {
    await connectDB();
    
    if (!isConnected || !Memory) {
      return res.status(503).json({ 
        error: "Database not available", 
        message: "App is running in demo mode using localStorage",
        connection_error: connectionError
      });
    }

    const memories = await Memory.find().sort({ created_at: -1 }).limit(100);
    res.json(memories);
  } catch (err) {
    console.error("Error fetching memories:", err);
    res.status(500).json({ 
      error: "Failed to fetch memories",
      message: err.message
    });
  }
});

// Create a memory with enhanced error handling
app.post("/api/memories", async (req, res) => {
  try {
    await connectDB();
    
    if (!isConnected || !Memory) {
      return res.status(503).json({ 
        error: "Database not available", 
        message: "App is running in demo mode using localStorage",
        connection_error: connectionError
      });
    }

    const { title, description, image_url, username, user_id } = req.body;
    
    // Enhanced validation
    if (!title || !image_url || !username || !user_id) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["title", "image_url", "username", "user_id"],
        received: { title: !!title, image_url: !!image_url, username: !!username, user_id: !!user_id }
      });
    }

    // Check image_url size (if it's base64, it might be too large)
    if (image_url.length > 1000000) { // 1MB limit for base64
      return res.status(413).json({
        error: "Image data too large",
        message: "Please use a smaller image or an image URL instead of uploading large files",
        size_limit: "1MB for base64 images"
      });
    }

    const memory = new Memory({ 
      title: title.trim(), 
      description: description ? description.trim() : '', 
      image_url: image_url.trim(), 
      username: username.trim(), 
      user_id: parseInt(user_id),
      likes: 0,
      likedBy: [],
      comments: []
    });
    
    await memory.save();
    console.log("✅ Memory created successfully for user:", username);
    res.status(201).json(memory);
    
  } catch (err) {
    console.error("Error creating memory:", err);
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: err.message 
      });
    }
    
    if (err.code === 11000) {
      return res.status(409).json({ 
        error: "Duplicate entry", 
        details: err.message 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to create memory", 
      details: err.message 
    });
  }
});

// Delete memory by id
app.delete("/api/memories/:id", async (req, res) => {
  try {
    await connectDB();
    
    if (!isConnected || !Memory) {
      return res.status(503).json({ 
        error: "Database not available"
      });
    }

    const deleted = await Memory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Memory not found" });
    }
    res.json({ ok: true, message: "Memory deleted successfully" });
  } catch (err) {
    console.error("Error deleting memory:", err);
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

// Like/unlike memory
app.post("/api/memories/:id/like", async (req, res) => {
  try {
    await connectDB();
    
    if (!isConnected || !Memory) {
      return res.status(503).json({ 
        error: "Database not available"
      });
    }

    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    const memory = await Memory.findById(req.params.id);
    if (!memory) {
      return res.status(404).json({ error: "Memory not found" });
    }

    const userIdNum = parseInt(userId);
    const hasLiked = memory.likedBy.includes(userIdNum);

    if (hasLiked) {
      memory.likedBy = memory.likedBy.filter(id => id !== userIdNum);
      memory.likes = Math.max(0, memory.likes - 1);
    } else {
      memory.likedBy.push(userIdNum);
      memory.likes = memory.likes + 1;
    }

    await memory.save();
    res.json(memory);
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ error: "Like operation failed", details: err.message });
  }
});

// Serve index.html for all non-API routes
app.get("*", (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).end();
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Export for Vercel
module.exports = app;