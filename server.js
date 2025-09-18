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
  // If the request has a file extension (.css, .js, .png), skip
  if (path.extname(req.path)) {
    res.status(404).end();
    return;
  }
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
