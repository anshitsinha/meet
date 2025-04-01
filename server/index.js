const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();
const CLIENT = process.env.CLIENT;
console.log("Allowed Origin:", CLIENT);

const app = express();
// CORS Configuration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", CLIENT);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: CLIENT,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});
const PORT = 5000;

io.on("connection", (socket) => {
  socket.emit("me", socket.id);

  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
  });

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGO;
app.use(express.json());

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB 🚀"))
  .catch((error) => console.error("MongoDB connection failed:", error));

app.use(express.urlencoded({ extended: true }));

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// ➤ Enhanced User schema with roles and additional fields
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "influencer", "admin"],
    default: "user",
  },
  wallet: {
    type: Number,
    default: 0,
    required: function () {
      return this.role === "user";
    },
  },
  transactionHistory: [
    {
      type: { type: String, enum: ["call", "chat", "recharge"] },
      amount: Number,
      date: { type: Date, default: Date.now },
    },
  ],
  ratePerMinute: {
    video: { type: Number, default: 0 },
    voice: { type: Number, default: 0 },
    chat: { type: Number, default: 0 },
  },
  availability: {
    days: [String], // e.g., ["Monday", "Wednesday"]
    timeSlots: [String], // e.g., ["10:00-12:00", "14:00-16:00"]
  },
  earnings: {
    type: Number,
    default: 0,
  },
  withdrawRequests: [
    {
      amount: Number,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      date: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// 🔒 Middleware for verifying token and roles
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    if (!req.user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// ➤ Route to get user profile data
app.get("/user-profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProfile = {
      username: user.username,
      email: user.email,
      role: user.role,
    };

    if (user.role === "influencer") {
      userProfile.ratePerMinute = user.ratePerMinute;
      userProfile.availability = user.availability;
      userProfile.earnings = user.earnings;
      userProfile.withdrawRequests = user.withdrawRequests;
    } else if (user.role === "user") {
      userProfile.wallet = user.wallet;
      userProfile.transactionHistory = user.transactionHistory;
    }

    res.status(200).json({ user: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/get-influencers", authenticate, async (req, res) => {
  try {
    // Fetch all users with the role 'influencer' from the database
    const influencers = await User.find({ role: "influencer" });

    if (!influencers || influencers.length === 0) {
      return res.status(404).json({ message: "No influencers available" });
    }

    // Send the influencers' data (username, ratePerMinute, etc.)
    const influencerData = influencers.map((influencer) => ({
      username: influencer.username,
      ratePerMinute: influencer.ratePerMinute,
      id: influencer._id,
    }));

    res.status(200).json({ influencers: influencerData });
  } catch (error) {
    console.error("Error fetching influencers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ➤ Recharge wallet (user only)
// ➤ Recharge wallet (user only)
app.post("/wallet/recharge", authenticate, async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    req.user.wallet += amount; // Recharge the wallet
    req.user.transactionHistory.push({ type: "recharge", amount });
    await req.user.save();

    res.json({
      message: "Wallet recharged successfully",
      wallet: req.user.wallet, // Return updated wallet balance
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ➤ Check if user has enough balance for call/chat/video
// ➤ Check if user has enough balance for call/chat/video
app.post("/check-balance", authenticate, async (req, res) => {
  try {
    const { type, duration, influencerId } = req.body;

    console.log("Received balance check request:", req.body);

    if (!type || !duration || !influencerId) {
      return res.status(400).json({
        message: "Missing required parameters",
        required: ["type", "duration", "influencerId"],
        received: req.body,
      });
    }

    const user = req.user;
    const influencer = await User.findById(influencerId);

    if (!influencer || influencer.role !== "influencer") {
      return res.status(404).json({ message: "Influencer not found" });
    }

    // Validate call type
    const validCallTypes = ["video", "voice", "chat"];
    if (!validCallTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid call type",
        validTypes: validCallTypes,
      });
    }

    const rate = influencer.ratePerMinute[type];
    if (!rate || isNaN(rate)) {
      return res.status(400).json({
        message: "Invalid rate configuration",
        influencerRates: influencer.ratePerMinute,
      });
    }

    const totalCost = rate * duration;

    if (user.wallet < totalCost) {
      return res.status(200).json({
        message: "Insufficient balance",
        required: totalCost,
        currentBalance: user.wallet,
      });
    }

    res.status(200).json({
      message: "Sufficient balance",
      totalCost,
      currentBalance: user.wallet,
      remainingBalance: user.wallet - totalCost,
    });
  } catch (error) {
    console.error("Error checking balance:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ➤ Process call/chat/video call
app.post("/make-call", authenticate, async (req, res) => {
  const { type, duration, influencerId } = req.body;

  if (!type || !duration || !influencerId) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const user = req.user;
    const influencer = await User.findById(influencerId);
    if (!influencer || influencer.role !== "influencer") {
      return res.status(404).json({ message: "Influencer not found" });
    }

    const rate = influencer.ratePerMinute[type];
    const totalCost = rate * duration;

    if (user.wallet < totalCost) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct balance and record transaction
    user.wallet -= totalCost;
    user.transactionHistory.push({ type, amount: totalCost });
    influencer.earnings += totalCost;

    await user.save();
    await influencer.save();

    res.status(200).json({
      message: `${type} with ${influencer.username} started successfully`,
      wallet: user.wallet,
      earnings: influencer.earnings,
    });
  } catch (error) {
    console.error("Error processing call:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ➤ Register User
app.post("/register/user", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: "user",
      wallet: 0,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("User registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ➤ Register Influencer
app.post("/register/influencer", async (req, res) => {
  const { username, email, password, ratePerMinute, availability } = req.body;

  if (!username || !email || !password || !ratePerMinute || !availability) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Influencer already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newInfluencer = new User({
      username,
      email,
      password: hashedPassword,
      role: "influencer",
      ratePerMinute,
      availability,
    });

    await newInfluencer.save();
    res.status(201).json({ message: "Influencer registered successfully" });
  } catch (error) {
    console.error("Influencer registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ➤ Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "3h",
    });

    res
      .status(200)
      .json({ message: "Login successful", token, role: user.role });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ➤ Influencer withdraw request
app.post("/withdraw", authenticate, async (req, res) => {
  if (req.user.role !== "influencer") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  if (amount > req.user.earnings) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  req.user.earnings -= amount;
  req.user.withdrawRequests.push({ amount, status: "pending" });
  await req.user.save();

  res.json({ message: "Withdrawal request sent", balance: req.user.earnings });
});

// ➤ Admin route for viewing withdrawals
app.get("/admin/withdrawals", authenticate, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const withdrawals = await User.find({ "withdrawRequests.status": "pending" });
  res.json({ withdrawals });
});

// WebSocket server for real-time communication
const WebSocket = require("ws");
const wss = new WebSocket.Server({ noServer: true });

// Map to store WebSocket connections by userId
const connections = new Map();

wss.on("connection", (ws, userId) => {
  console.log(`User ${userId} connected to WebSocket`);
  connections.set(userId, ws);

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      handleSignalingMessage(userId, data);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    console.log(`User ${userId} disconnected from WebSocket`);
    connections.delete(userId);
  });
});

function handleSignalingMessage(senderId, data) {
  const { recipientId, ...message } = data;

  if (connections.has(recipientId)) {
    connections.get(recipientId).send(
      JSON.stringify({
        ...message,
        senderId,
      })
    );
  }
}

// Attach WebSocket to HTTP server
app.on("upgrade", (request, socket, head) => {
  const token = request.headers["sec-websocket-protocol"];

  if (!token) {
    socket.destroy();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, decoded.userId);
    });
  } catch (error) {
    socket.destroy();
  }
});

// Add this to your server setup
app.get("/webrtc-token", authenticate, (req, res) => {
  const token = jwt.sign({ userId: req.user._id }, JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token });
});

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("hi");
});

// ➤ Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
