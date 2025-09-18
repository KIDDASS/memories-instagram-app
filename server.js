// server.js
const express = require("express");
const path = require("path");

const app = express();

// ✅ Serve static files from current directory
app.use(express.static(__dirname));

// ✅ API route (for testing backend)
app.get("/api/test", (req, res) => {
  res.json({ message: "✅ Backend is working!" });
});

// ✅ Catch-all route (only for SPA routes, not files)
app.get("*", (req, res) => {
  if (path.extname(req.path)) {
    // If it's a file request (.css, .js, .png, etc.), skip
    res.status(404).end();
    return;
  }
  res.sendFile(path.join(__dirname, "index.html"));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
