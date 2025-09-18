// server.js - Vercel Serverless Compatible
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// Serve static files from public directory (Vercel expects this structure)
app.use(express.static(path.join(__dirname, "public")));

// Memory Schema (inline since Vercel has issues with relative imports)
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

// Add indexes for better performance
memorySchema.index({ created_at: -1 });
memorySchema.index({ user_id: 1 });

let Memory;
let isConnected = false;

// MongoDB connection function
async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log("No MONGODB_URI found, API will return errors (app works in demo mode)");
      return;
    }

    await mongoose.connect(mongoUri);
    Memory = mongoose.model("Memory", memorySchema);
    isConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    isConnected = false;
  }
}

// --- API endpoints ---

// Health check endpoint
app.get("/api/health", async (req, res) => {
  await connectDB();
  res.json({ 
    status: "ok", 
    message: "Server is running",
    database: isConnected ? "connected" : "disconnected"
  });
});

// Get all memories (newest first)
app.get("/api/memories", async (req, res) => {
  try {
    await connectDB();
    
    if (!isConnected || !Memory) {
      return res.status(503).json({ 
        error: "Database not available", 
        message: "App is running in demo mode using localStorage" 
      });
    }

    const memories = await Memory.find().sort({ created_at: -1 }).limit(100);
    res.json(memories);
  } catch (err) {
    console.error("Error fetching memories:", err);
    res.status(500).json({ 
      error: "Failed to fetch memories",
      message: "Database error - app will use localStorage instead"
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
        message: "App is running in demo mode using localStorage" 
      });
    }

    const { title, description, image_url, username, user_id } = req.body;
    
    // Validation
    if (!title || !image_url || !username || !user_id) {
      return res.status(400).json({ 
        error: "title, image_url, username, and user_id are required" 
      });
    }

    // Create new memory
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
    res.status(500).json({ error: "Failed to create memory" });
  }
});

// Delete memory by id
app.delete("/api/memories/:id", async (req, res) => {
  try {
    await connectDB();
    
    if (!isConnected || !Memory) {
      return res.status(503).json({ 
        error: "Database not available", 
        message: "App is running in demo mode using localStorage" 
      });
    }

    const deleted = await Memory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Memory not found" });
    }
    res.json({ ok: true, message: "Memory deleted successfully" });
  } catch (err) {
    console.error("Error deleting memory:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// Like/unlike memory
app.post("/api/memories/:id/like", async (req, res) => {
  try {
    await connectDB();
    
    if (!isConnected || !Memory) {
      return res.status(503).json({ 
        error: "Database not available", 
        message: "App is running in demo mode using localStorage" 
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
      // Unlike
      memory.likedBy = memory.likedBy.filter(id => id !== userIdNum);
      memory.likes = Math.max(0, memory.likes - 1);
    } else {
      // Like
      memory.likedBy.push(userIdNum);
      memory.likes = memory.likes + 1;
    }

    await memory.save();
    res.json(memory);
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ error: "Like operation failed" });
  }
});

// Add comment to memory
app.post("/api/memories/:id/comments", async (req, res) => {
  try {
    await connectDB();
    
    if (!isConnected || !Memory) {
      return res.status(503).json({ 
        error: "Database not available", 
        message: "App is running in demo mode using localStorage" 
      });
    }

    const { text, username, userId } = req.body;
    
    if (!text || !username || !userId) {
      return res.status(400).json({ 
        error: "text, username, and userId are required" 
      });
    }
    
    const memory = await Memory.findById(req.params.id);
    if (!memory) {
      return res.status(404).json({ error: "Memory not found" });
    }

    const comment = {
      userId: parseInt(userId),
      username: username.trim(),
      text: text.trim(),
      created_at: new Date()
    };

    memory.comments.push(comment);
    await memory.save();
    
    res.status(201).json(comment);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Get memory by id
app.get("/api/memories/:id", async (req, res) => {
  try {
    await connectDB();
    
    if (!isConnected || !Memory) {
      return res.status(503).json({ 
        error: "Database not available", 
        message: "App is running in demo mode using localStorage" 
      });
    }

    const memory = await Memory.findById(req.params.id);
    if (!memory) {
      return res.status(404).json({ error: "Memory not found" });
    }
    res.json(memory);
  } catch (err) {
    console.error("Error fetching memory:", err);
    res.status(500).json({ error: "Failed to fetch memory" });
  }
});

// Serve index.html for all non-API routes (SPA support)
app.get("*", (req, res) => {
  // Don't serve HTML for requests with file extensions
  if (path.extname(req.path)) {
    return res.status(404).end();
  }
  
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Export for Vercel
module.exports = app;