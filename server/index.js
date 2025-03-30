const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const SECRET_KEY = "demo_secret";

// Mock Database
const users = [
  { id: 1, name: "Influencer1", role: "influencer", wallet: 100 },
  { id: 2, name: "User1", role: "user", wallet: 50 },
  { id: 3, name: "Admin", role: "admin", wallet: 0 },
];

// Authentication
app.post("/login", (req, res) => {
  const { name } = req.body;
  const user = users.find((u) => u.name === name);
  if (user) {
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token, user });
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// Recharge Wallet
app.post("/recharge", (req, res) => {
  const { id, amount } = req.body;
  const user = users.find((u) => u.id === id);
  if (user) {
    user.wallet += amount;
    res.json({ wallet: user.wallet });
  } else {
    res.status(404).send("User not found");
  }
});

// Admin - Get all users
app.get("/admin/users", (req, res) => {
  res.json(users);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
