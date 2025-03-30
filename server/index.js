const express = require("express");
const cors = require("cors"); // Import CORS middleware
const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:3000" })); // Allow requests from Next.js

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample route
app.get("/", (req, res) => {
  res.send("Server is running on port 5000");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
