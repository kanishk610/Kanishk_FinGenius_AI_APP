require('dotenv').config();
console.log("🔑 OpenAI Key:", process.env.OPENAI_API_KEY);
const express = require("express");
const path = require("path");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // <-- This is the main fix!
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

//  Redirect "/" to "/FinGenius.html"
app.get("/", (req, res) => {
  res.redirect("/FinGenius.html");
});

//  Serve the chatbot at "/FinGenius.html" directly
app.get("/FinGenius.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "FinGenius.html"));
});

// ✅ OpenAI API Chatbot route
const OpenAI = require("openai"); // Top of your file

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure your .env has this key
});

app.post("/api/chatbot", async (req, res) => {
  console.log("🟣 Incoming body:", req.body);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: req.body.message }],
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("🔴 OpenAI API Error:", error);
    res.status(500).json({ error: "AI error. Try again later." });
  }
});


// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}/FinGenius.html`);
});
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});







// --- Simulated Database ---
let users = {}; // Stores user data: { aadhaar: { name, savings, investments, vaultDocs, scamsReported } }
let financialGoals = {}; // Stores goals per user: { aadhaar: [{ id, name, targetAmount, targetDate, currentAmount }] }
let vaultDocuments = {}; // Stores vault docs per user: { aadhaar: [{ id, name, category, url }] }
let reportedScams = []; // Stores global reported scams: [{ id, title, warning, redFlags, safetyTip }]

// Initial dummy data for scams
reportedScams.push(
    { id: 'scam1', title: 'Fake Lottery Call', warning: 'Callers promise large sums of money from a lottery you never entered.', redFlags: 'Ask for upfront fees, urgent action, unofficial numbers.', safetyTip: 'Never pay upfront fees for lottery winnings. Legitimate lotteries do not ask for money to release prizes.' },
    { id: 'scam2', title: 'Phishing Email (Bank)', warning: 'Emails pretending to be from your bank asking for account details or to click suspicious links.', redFlags: 'Generic greetings, urgent tone, spelling errors, suspicious links.', safetyTip: 'Always verify the sender. Do not click on suspicious links. Go directly to your bank\'s official website.' },
    { id: 'scam3', title: 'Job Offer Scam', warning: 'Offers fake job opportunities, often requiring payment for training or background checks.', redFlags: 'Too good to be true salaries, requests for personal financial info, upfront fees.', safetyTip: 'Legitimate employers do not ask for money during the hiring process. Research the company thoroughly.' },
    { id: 'scam4', title: 'Investment Scheme Scam', warning: 'Promises high returns with little to no risk, often through complex or vague investment models.', redFlags: 'Guaranteed high returns, pressure to invest quickly, unregistered advisors.', safetyTip: 'If it sounds too good to be true, it probably is. Consult with SEBI-registered financial advisors.' }
);

// --- API Endpoints ---

// User Login (Simulated)
app.post('/api/login', (req, res) => {
    const { aadhaar, name } = req.body;

    if (!aadhaar || !name) {
        return res.status(400).json({ success: false, message: 'Aadhaar number and name are required.' });
    }

    // Simulate user creation/retrieval
    if (!users[aadhaar]) {
        users[aadhaar] = {
            name: name,
            savings: 0,
            investments: 0,
            vaultDocs: 0,
            scamsReported: 0
        };
        financialGoals[aadhaar] = [];
        vaultDocuments[aadhaar] = [];
        console.log(`New user registered: ${name} (${aadhaar})`);
    } else {
        // Update name if user already exists (e.g., if they change it)
        users[aadhaar].name = name;
        console.log(`User logged in: ${name} (${aadhaar})`);
    }

    res.json({ success: true, message: 'Login successful!', user: users[aadhaar] });
});

// Get User Data (Simulated)
app.get('/api/user/:aadhaar', (req, res) => {
    const { aadhaar } = req.params;
    const user = users[aadhaar];

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user });
});



// Expense Analyzer API (Simulated)
app.post('/api/analyze-expenses', (req, res) => {
    const { messages } = req.body;
    const expenses = [];
    let totalExpenses = 0;

    // Simple regex to extract amount and a basic description
    const regex = /(?:Rs\.?|INR)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:at|for|to|from)\s*([a-zA-Z0-9\s&]+?)(?:\.|$)/gi;
    const lines = messages.split('\n');

    lines.forEach(line => {
        let match;
        while ((match = regex.exec(line)) !== null) {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            let description = match[2].trim();

            // Basic categorization based on keywords
            let category = 'Other';
            if (description.match(/zomato|swiggy|restaurant|food|cafe/i)) {
                category = 'Food';
            } else if (description.match(/bigbazaar|reliance fresh|grocery|supermarket/i)) {
                category = 'Groceries';
            } else if (description.match(/petrol|fuel|ola|uber|bus|train/i)) {
                category = 'Transport';
            } else if (description.match(/electricity|water|bill/i)) {
                category = 'Utilities';
            } else if (description.match(/movie|cinema|entertainment/i)) {
                category = 'Entertainment';
            } else if (description.match(/rent/i)) {
                category = 'Rent';
            }

            expenses.push({ description, amount, category });
            totalExpenses += amount;
        }
    });

    res.json({ success: true, expenses, totalExpenses });
});


