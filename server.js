// server.js
const express = require("express");
const path = require("path");

const app = express();

// ✅ Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname)));

// ✅ API test route (optional, good for debugging)
app.get("/api/test", (req, res) => {
  res.json({ message: "✅ Backend is working!" });
});

// ✅ Catch-all route: only send index.html if the request is not for a file
app.get("*", (req, res) => {
  if (req.path.includes(".")) {
    // If URL looks like a file (e.g. .css, .js), don't hijack it
    res.status(404).end();
  } else {
    res.sendFile(path.join(__dirname, "index.html"));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
