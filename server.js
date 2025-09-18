const express = require("express");
const path = require("path");

const app = express();

// ✅ Serve static files (CSS, JS, images) from root
app.use(express.static(path.join(__dirname)));

// ✅ API test route
app.get("/api/test", (req, res) => {
  res.json({ message: "✅ Backend is working!" });
});

// ✅ Catch-all route for SPA (only when not requesting a file)
app.get("*", (req, res) => {
  if (path.extname(req.path)) {
    // If it's a file request (like .css, .js), skip
    res.status(404).end();
    return;
  }
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// ✅ Auto-select new port if 3000 is busy
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`⚠️ Port ${PORT} is busy, trying another port...`);
    app.listen(0, () => {
      console.log(`✅ Server restarted at http://localhost:${server.address().port}`);
    });
  } else {
    throw err;
  }
});
