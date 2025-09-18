const express = require("express");
const path = require("path");
const app = express();

// ✅ Serve everything from /public
app.use(express.static(path.join(__dirname, "public")));

// ✅ Test API
app.get("/api/test", (req, res) => {
  res.json({ message: "✅ Backend is working!" });
});

// ✅ Serve index.html from /views
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
