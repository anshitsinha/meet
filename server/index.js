const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = 5000;

const CLIENT= process.env.CLIENT

app.use(
  cors({
    origin: [CLIENT], // Allow requests from Next.js
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow credentials (e.g., cookies)
  })
);

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
app.post("/check-balance", authenticate, async (req, res) => {
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
    const totalCost = rate * duration; // duration is in minutes

    if (user.wallet < totalCost) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    res.status(200).json({ message: "Sufficient balance", totalCost });
  } catch (error) {
    console.error("Error checking balance:", error);
    res.status(500).json({ message: "Server error" });
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

// ➤ Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
