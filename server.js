const express = require("express");
const path = require("path");

const app = express();

// ✅ Serve static files (CSS, JS, images)
app.use(express.static(__dirname));

// ✅ Example API route to test backend
app.get("/api/test", (req, res) => {
  res.json({ message: "✅ Backend is working!" });
});

// ✅ Catch-all route for SPA (only when not requesting files)
app.get("*", (req, res) => {
  if (path.extname(req.path)) {
    // If the path has a file extension (.css, .js, .png), don't hijack it
    res.status(404).end();
  } else {
    res.sendFile(path.join(__dirname, "index.html"));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
