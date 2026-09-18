const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected Successfully 🚀"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "CampusGig Backend is running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CampusGig server running on http://localhost:${PORT}`);
});