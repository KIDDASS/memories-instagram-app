// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Memory = require("./models/Memory");

const app = express();
app.use(express.json());

// Serve static files from views directory (where your HTML, CSS, JS are)
app.use(express.static(path.join(__dirname, "views")));

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("MONGODB_URI not set. Add it to .env or Vercel env vars.");
  process.exit(1);
}

mongoose.connect(mongoUri)
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// --- API endpoints ---

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Get all memories (newest first)
app.get("/api/memories", async (req, res) => {
  try {
    const memories = await Memory.find().sort({ created_at: -1 }).limit(100);
    res.json(memories);
  } catch (err) {
    console.error("Error fetching memories:", err);
    res.status(500).json({ error: "Failed to fetch memories" });
  }
});

// Create a memory
app.post("/api/memories", async (req, res) => {
  try {
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
  
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Handle server startup errors
server.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.warn(`Port ${PORT} in use; trying a random port...`);
    const newServer = app.listen(0, () => {
      console.log(`🚀 Server restarted on port ${newServer.address().port}`);
    });
  } else {
    throw err;
  }
});