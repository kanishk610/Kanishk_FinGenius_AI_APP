require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// Models
const User = require("./models/User");
const Goal = require("./models/Goal");
const VaultDoc = require("./models/VaultDoc");
const Scam = require("./models/Scam");

// Routes
app.get("/", (req, res) => res.redirect("/FinGenius.html"));
app.get("/FinGenius.html", (req, res) => res.sendFile(path.join(__dirname, "public", "FinGenius.html")));

// OpenAI Chatbot Route
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


app.post("/api/chatbot", async (req, res) => {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: req.body.message }],
    });
    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("🔴 OpenAI API Error:", error);
    res.status(500).json({ error: "AI error. Try again later." });
  }
});

// Login API
app.post("/api/login", async (req, res) => {
  const { aadhaar, name } = req.body;
  if (!aadhaar || !name) return res.status(400).json({ success: false, message: "Aadhaar and name are required." });

  let user = await User.findOne({ aadhaar });
  if (!user) user = new User({ aadhaar, name });
  else user.name = name;

  await user.save();
  res.json({ success: true, user });
});

// Financial Goals
app.post("/api/goals/:aadhaar", async (req, res) => {
  const { aadhaar } = req.params;
  const { name, targetAmount, targetDate } = req.body;

  const goal = new Goal({ aadhaar, name, targetAmount, targetDate });
  await goal.save();

  res.json({ success: true, goal });
});

app.get("/api/goals/:aadhaar", async (req, res) => {
  const goals = await Goal.find({ aadhaar: req.params.aadhaar });
  res.json({ success: true, goals });
});

// Vault API
app.post("/api/vault/:aadhaar", async (req, res) => {
  const { aadhaar } = req.params;
  const { fileName, fileCategory, fileUrl } = req.body;

  const doc = new VaultDoc({ aadhaar, name: fileName, category: fileCategory, url: fileUrl });
  await doc.save();

  const count = await VaultDoc.countDocuments({ aadhaar });
  await User.findOneAndUpdate({ aadhaar }, { vaultDocs: count });

  res.json({ success: true, document: doc });
});

app.get("/api/vault/:aadhaar", async (req, res) => {
  const docs = await VaultDoc.find({ aadhaar: req.params.aadhaar });
  res.json({ success: true, documents: docs });
});

app.delete("/api/vault/:aadhaar/:docId", async (req, res) => {
  await VaultDoc.deleteOne({ _id: req.params.docId });
  const count = await VaultDoc.countDocuments({ aadhaar: req.params.aadhaar });
  await User.findOneAndUpdate({ aadhaar: req.params.aadhaar }, { vaultDocs: count });

  res.json({ success: true, message: "Document deleted successfully!" });
});

// Scam Reporting
app.post("/api/scams/report", async (req, res) => {
  const { aadhaar, title, warning, redFlags, safetyTip } = req.body;
  const scam = new Scam({ title, warning, redFlags, safetyTip, reportedBy: aadhaar });
  await scam.save();

  const count = await Scam.countDocuments({ reportedBy: aadhaar });
  await User.findOneAndUpdate({ aadhaar }, { scamsReported: count });

  res.json({ success: true, scam });
});

app.get("/api/scams", async (req, res) => {
  const scams = await Scam.find().sort({ createdAt: -1 });
  res.json({ success: true, scams });
});

// UPI Payment Simulator
app.post("/api/upi-payment", (req, res) => {
  const { amount, upiId } = req.body;
  setTimeout(() => {
    if (Math.random() > 0.2) {
      res.json({ success: true, message: `Payment of ₹${amount} to ${upiId} successful!` });
    } else {
      res.status(400).json({ success: false, message: `Payment to ${upiId} failed.` });
    }
  }, 2000);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}/FinGenius.html`);
});
