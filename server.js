// server.js - Debug Version with Connection Logging
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

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

// Enhanced MongoDB connection function with detailed logging
async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    console.log("=== MongoDB Connection Debug ===");
    console.log("Environment check:", process.env.MONGODB_URI ? "MONGODB_URI exists" : "MONGODB_URI missing");
    
    if (!mongoUri) {
      connectionError = "MONGODB_URI environment variable not found";
      console.log("Error: No MONGODB_URI found");
      return;
    }

    // Mask password for logging
    const maskedUri = mongoUri.replace(/:([^@]+)@/, ':***@');
    console.log("Attempting connection to:", maskedUri);
    
    // Set connection timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000,
    });
    
    Memory = mongoose.model("Memory", memorySchema);
    isConnected = true;
    connectionError = null;
    console.log("✅ Successfully connected to MongoDB");
    
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    connectionError = error.message;
    isConnected = false;
  }
}

// Enhanced health check with detailed info
app.get("/api/health", async (req, res) => {
  await connectDB();
  
  res.json({ 
    status: "ok", 
    message: "Server is running",
    database: isConnected ? "connected" : "disconnected",
    mongodb_uri_exists: !!process.env.MONGODB_URI,
    connection_error: connectionError,
    mongoose_ready_state: mongoose.connection.readyState,
    environment_vars_count: Object.keys(process.env).length,
    node_version: process.version
  });
});

// Debug endpoint to check environment variables (without exposing sensitive data)
app.get("/api/debug", async (req, res) => {
  const envVars = Object.keys(process.env);
  const mongoUriExists = process.env.MONGODB_URI ? true : false;
  const mongoUriLength = process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0;
  
  res.json({
    environment_variables_available: envVars.length,
    mongodb_uri_exists: mongoUriExists,
    mongodb_uri_length: mongoUriLength,
    has_vercel_env: process.env.VERCEL ? true : false,
    connection_attempts: connectionError ? 1 : 0,
    last_error: connectionError
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

// Create a memory
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
    
    if (!title || !image_url || !username || !user_id) {
      return res.status(400).json({ 
        error: "title, image_url, username, and user_id are required" 
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
    res.status(201).json(memory);
  } catch (err) {
    console.error("Error creating memory:", err);
    res.status(500).json({ error: "Failed to create memory", details: err.message });
  }
});

// Delete memory by id
app.delete("/api/memories/:id", async (req, res) => {
  try {
    await connectDB();
    
    if (!isConnected || !Memory) {
      return res.status(503).json({ 
        error: "Database not available", 
        connection_error: connectionError
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
        error: "Database not available", 
        connection_error: connectionError
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