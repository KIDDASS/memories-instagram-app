// models/Memory.js
const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const MemorySchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  username: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  image_url: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: { type: [Number], default: [] },
  comments: { type: [CommentSchema], default: [] },
  created_at: { type: Date, default: Date.now }
});

// Add indexes for better performance
MemorySchema.index({ created_at: -1 });
MemorySchema.index({ user_id: 1 });
MemorySchema.index({ username: 1 });

module.exports = mongoose.model("Memory", MemorySchema);