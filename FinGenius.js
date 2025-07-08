
// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                showToast('FinGenius is ready for offline use!', 'info');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
                showToast('Offline features may not be available.', 'error');
            });
    });
}

// Particle Animation
const particlesContainer = document.getElementById('particles');
function createParticle() {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = Math.random() * 100 + 'vh';
    particle.style.animationDuration = (Math.random() * 5 + 5) + 's'; // 5-10s
    particle.style.animationDelay = (Math.random() * 5) + 's'; // 0-5s delay
    particlesContainer.appendChild(particle);

    // Remove particle after animation ends to prevent too many elements
    particle.addEventListener('animationend', () => {
        particle.remove();
    });
}

// Generate particles periodically
setInterval(createParticle, 500); // Create a new particle every 0.5 seconds

// --- Global UI Elements & Helpers ---
const toastContainer = document.getElementById('toast-container');

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000); // Toast disappears after 3 seconds
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// --- Core App Logic ---
const loginForm = document.getElementById('loginForm');
const dashboard = document.getElementById('dashboard');
const loginFormElement = document.getElementById('loginFormElement');
const userNameSpan = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

const moduleContainers = document.querySelectorAll('.module-container');
const moduleCards = document.querySelectorAll('.module-card');

let loggedInUser = null;
let userFinancialData = {
    savings: 50000, // Simulated initial data
    investments: 10000, // New stat
    vaultDocs: 0,
    scamsReported: 0
};
let currentScams = [
    { title: 'Fake Loan Apps', warning: 'Apps promising instant loans without proper documentation', redFlags: 'No RBI license, asking for sensitive photos, threatening behavior', tip: 'Always verify loan apps through RBI\'s official website', critical: false },
    { title: 'Investment Ponzi Schemes', warning: 'Promises of unrealistic returns (50%+ per month)', redFlags: 'Referral bonuses, pressure to invest quickly, no clear business model', tip: 'If it sounds too good to be true, it probably is. Consult a SEBI-registered advisor.', critical: true },
    { title: 'Phishing & OTP Scams', warning: 'Fraudulent messages/calls asking for OTP, PIN, or bank details', redFlags: 'Urgent requests, suspicious links, unknown sender/caller claiming to be bank/govt. official', tip: 'Never share OTPs or personal banking details with anyone. Banks never ask for this information.', critical: false }
];
let financialGoals = []; // Array to store financial goals
let analyzedExpenses = []; // Array to store analyzed expenses

// Function to update dashboard stats
function updateDashboardStats() {
    document.getElementById('dashboardSavings').textContent = userFinancialData.savings.toLocaleString('en-IN');
    document.getElementById('dashboardInvestments').textContent = userFinancialData.investments.toLocaleString('en-IN');
    document.getElementById('dashboardVaultDocs').textContent = userFinancialData.vaultDocs;
    document.getElementById('dashboardScamsReported').textContent = userFinancialData.scamsReported;
}

// Login Logic
loginFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const aadhaar = document.getElementById('aadhaar').value;
    const name = document.getElementById('name').value;

    if (aadhaar.length === 12 && name.trim() !== '') {
        loggedInUser = { aadhaar, name };
        userNameSpan.textContent = name;
        loginForm.style.display = 'none';
        dashboard.classList.add('show');
        updateDashboardStats(); // Update stats on login
        showToast('Login successful! Welcome to FinGenius.', 'success');
        startSimulatedScamAlerts(); // Start periodic scam alerts
    } else {
        showToast('Please enter a valid 12-digit Aadhaar number and your full name.', 'error');
    }
});

// Logout Logic
logoutBtn.addEventListener('click', () => {
    loggedInUser = null;
    dashboard.classList.remove('show');
    loginForm.style.display = 'block';
    document.getElementById('aadhaar').value = '';
    document.getElementById('name').value = '';
    showToast('You have been logged out.', 'info');
    // Hide all modules when logging out
    moduleContainers.forEach(container => container.classList.remove('active'));
    clearInterval(scamAlertInterval); // Stop scam alerts on logout
});

// Show Dashboard
function showDashboard() {
    moduleContainers.forEach(container => container.classList.remove('active'));
    dashboard.classList.add('show');
    updateDashboardStats(); // Update stats when returning to dashboard
}

// Module Navigation
moduleCards.forEach(card => {
    card.addEventListener('click', () => {
        const moduleName = card.dataset.module;
        dashboard.classList.remove('show');
        moduleContainers.forEach(container => {
            if (container.id === `${moduleName}Module`) {
                container.classList.add('active');
            } else {
                container.classList.remove('active');
            }
        });
        // Specific module initialization if needed
        if (moduleName === 'scam') {
            renderScamList(currentScams);
        } else if (moduleName === 'vault') {
            renderVaultFiles();
        } else if (moduleName === 'goals') {
            renderFinancialGoals(); // Render goals when module is opened
        } else if (moduleName === 'expenseAnalyzer') {
            renderAnalyzedExpenses(); // Render expenses when module is opened
        }
    });
});

// Chatbot Configuration
const chatInput = document.getElementById('chatInput');
const chatContainer = document.getElementById('chatContainer');
const chatLoading = document.getElementById('chatLoading');
const sendBtn = document.getElementById('sendBtn');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const suggestedQuestions = document.querySelector('.suggested-questions');

// Replace with your actual API key (for demo only)
const OPENAI_API_KEY = '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';
const OPENAI_API_URL = 'https://corsproxy.io/?https://api.openai.com/v1/chat/completions';



// Initial system prompt and history
let chatHistory = [
    {
        role: "system",
        content: "You are FinGenius, an AI financial assistant for Indian users. Provide advice on budgeting, savings, investment and scam awareness in simple Hinglish. Keep responses short and friendly."
    }
];

// Send Message Function
async function sendMessage() {
    const userMessageText = chatInput.value.trim();
    if (userMessageText === '') return;

    chatHistory.push({ role: "user", content: userMessageText });

    const userMessageDiv = document.createElement('div');
    userMessageDiv.classList.add('chat-message', 'user-message');
    userMessageDiv.textContent = userMessageText;
    chatContainer.appendChild(userMessageDiv);
    chatInput.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;

    chatLoading.classList.add('show');
    sendBtn.disabled = true;
    voiceInputBtn.disabled = true;

    try {
        try {
            const response = await fetch(('https://corsproxy.io/?https://api.openai.com/v1/chat/completions'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: chatHistory,
                    max_tokens: 200,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            const reply = data.choices[0].message.content.trim();

            chatHistory.push({ role: "assistant", content: reply });

            const botMessageDiv = document.createElement('div');
            botMessageDiv.classList.add('chat-message', 'bot-message');
            botMessageDiv.innerHTML = `<strong>FinGenius AI:</strong> ${reply}`;
            chatContainer.appendChild(botMessageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;

        } catch (err) {
            chatLoading.classList.remove('show');
            const errorMsg = document.createElement('div');
            errorMsg.classList.add('chat-message', 'bot-message');
            errorMsg.innerHTML = `<strong>FinGenius AI:</strong> API error: ${err.message}`;
            chatContainer.appendChild(errorMsg);
            console.error('OpenAI Error:', err);
        }
    } finally {
        chatLoading.classList.remove('show');
        sendBtn.disabled = false;
        voiceInputBtn.disabled = false;
    }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
suggestedQuestions.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        chatInput.value = e.target.dataset.question;
        sendMessage();
    }
});

// Voice Input
let recognition;
if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;

    recognition.onstart = () => voiceInputBtn.classList.add('recording');
    recognition.onend = () => voiceInputBtn.classList.remove('recording');

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        sendMessage();
    };

    voiceInputBtn.addEventListener('click', () => {
        try {
            recognition.start();
        } catch (err) {
            console.error('Voice recognition error:', err);
        }
    });
} else {
    voiceInputBtn.style.display = 'none';
}

// --- Expense Analyzer Module Logic ---
const transactionMessagesInput = document.getElementById('transactionMessages');
const expenseLoading = document.getElementById('expenseLoading');
const expenseSummaryDiv = document.getElementById('expenseSummary');
const expenseListDiv = document.getElementById('expenseList');
const totalAnalyzedExpensesSpan = document.getElementById('totalAnalyzedExpenses');

function analyzeExpenses() {
    const messages = transactionMessagesInput.value.split('\n');
    analyzedExpenses = [];
    let total = 0;

    expenseLoading.classList.add('show');
    expenseSummaryDiv.style.display = 'none';

    setTimeout(() => {
        messages.forEach(msg => {
            msg = msg.trim();
            if (msg === '') return;

            let amount = 0;
            let merchant = 'Unknown';
            let date = 'Unknown';

            // Regex to find amount (e.g., Rs. 500, INR 100, 250.00)
            const amountMatch = msg.match(/(?:Rs\.?|INR)\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR)/i);
            if (amountMatch) {
                amount = parseFloat(amountMatch[1] || amountMatch[2]);
            }

            // Regex to find merchant (simple keywords for common merchants)
            if (msg.toLowerCase().includes('zomato')) merchant = 'Zomato';
            else if (msg.toLowerCase().includes('swiggy')) merchant = 'Swiggy';
            else if (msg.toLowerCase().includes('bigbazaar') || msg.toLowerCase().includes('dmart')) merchant = 'Groceries';
            else if (msg.toLowerCase().includes('uber') || msg.toLowerCase().includes('ola')) merchant = 'Transport';
            else if (msg.toLowerCase().includes('recharge') || msg.toLowerCase().includes('bill')) merchant = 'Utilities/Bills';
            else if (msg.toLowerCase().includes('atm') || msg.toLowerCase().includes('cash')) merchant = 'Cash Withdrawal';
            else if (msg.toLowerCase().includes('paytm') || msg.toLowerCase().includes('gpay') || msg.toLowerCase().includes('phonepe')) merchant = 'UPI Transfer';
            else if (msg.toLowerCase().includes('debit') || msg.toLowerCase().includes('spent')) {
                // Try to extract merchant from common patterns like "at <MerchantName>"
                const merchantKeywordMatch = msg.match(/(?:at|for|to)\s+([A-Za-z0-9\s&]+?)(?:\s+on|\s+Txn|\s+Ref|\s+UPI|$)/i);
                if (merchantKeywordMatch && merchantKeywordMatch[1]) {
                    merchant = merchantKeywordMatch[1].trim();
                }
            }

            // Regex to find date (e.g., 20/07/2023, Jul 20, 2023)
            const dateMatch = msg.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{2,4}\b/i);
            if (dateMatch) {
                date = dateMatch[0];
            }

            if (amount > 0) {
                analyzedExpenses.push({ amount, merchant, date, raw: msg });
                total += amount;
            }
        });

        analyzedExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date

        renderAnalyzedExpenses(total);
        expenseLoading.classList.remove('show');
        expenseSummaryDiv.style.display = 'block';
        showToast('Expenses analyzed successfully!', 'success');
    }, 1500);
}

function renderAnalyzedExpenses(total) {
    expenseListDiv.innerHTML = '';
    if (analyzedExpenses.length === 0) {
        expenseListDiv.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5);">No expenses analyzed yet.</p>';
        totalAnalyzedExpensesSpan.textContent = '0';
        return;
    }

    analyzedExpenses.forEach(expense => {
        const expenseItemDiv = document.createElement('div');
        expenseItemDiv.classList.add('expense-item');
        expenseItemDiv.innerHTML = `
                    <span>${expense.date} - ${expense.merchant}</span>
                    <span class="amount">₹${expense.amount.toLocaleString('en-IN')}</span>
                `;
        expenseListDiv.appendChild(expenseItemDiv);
    });
    totalAnalyzedExpensesSpan.textContent = total.toLocaleString('en-IN');
}


// --- Budgeting Module Logic ---
const budgetLoading = document.getElementById('budgetLoading');
const budgetChartCanvas = document.getElementById('budgetChartCanvas');
const budgetAdvice = document.getElementById('budgetAdvice');
const expenseInputsDiv = document.getElementById('expenseInputs');
const addExpenseBtn = document.getElementById('addExpenseBtn');
let budgetChartInstance = null; // To store Chart.js instance

// Initial expenses (from HTML)
let expensesData = {
    "Rent": 0,
    "Food & Groceries": 0,
    "Transportation": 0,
    "Utilities": 0,
    "Entertainment": 0
};

// Populate initial expenses from HTML inputs
document.getElementById('rentExpense').addEventListener('input', (e) => expensesData["Rent"] = parseFloat(e.target.value) || 0);
document.getElementById('foodExpense').addEventListener('input', (e) => expensesData["Food & Groceries"] = parseFloat(e.target.value) || 0);
document.getElementById('transportExpense').addEventListener('input', (e) => expensesData["Transportation"] = parseFloat(e.target.value) || 0);
document.getElementById('utilitiesExpense').addEventListener('input', (e) => expensesData["Utilities"] = parseFloat(e.target.value) || 0);
document.getElementById('entertainmentExpense').addEventListener('input', (e) => expensesData["Entertainment"] = parseFloat(e.target.value) || 0);


addExpenseBtn.addEventListener('click', () => {
    const newExpenseGroup = document.createElement('div');
    newExpenseGroup.classList.add('form-group');
    const uniqueId = `customExpense${Date.now()}`;
    newExpenseGroup.innerHTML = `
                <label for="${uniqueId}Category">Custom Category</label>
                <input type="text" id="${uniqueId}Category" placeholder="e.g., Subscriptions">
                <label for="${uniqueId}Amount">Amount (₹)</label>
                <input type="number" id="${uniqueId}Amount" placeholder="0">
                <button class="btn" style="background: var(--danger-gradient); width: auto; padding: 8px 15px; font-size: 0.9rem; margin-top: 5px;" data-remove-id="${uniqueId}">Remove</button>
            `;
    expenseInputsDiv.appendChild(newExpenseGroup);

    // Add event listener for the new custom expense inputs
    document.getElementById(`${uniqueId}Category`).addEventListener('input', (e) => {
        const category = e.target.value.trim();
        const amount = parseFloat(document.getElementById(`${uniqueId}Amount`).value) || 0;
        if (category) {
            expensesData[category] = amount;
        } else {
            delete expensesData[category]; // Remove if category name is empty
        }
    });
    document.getElementById(`${uniqueId}Amount`).addEventListener('input', (e) => {
        const category = document.getElementById(`${uniqueId}Category`).value.trim();
        const amount = parseFloat(e.target.value) || 0;
        if (category) {
            expensesData[category] = amount;
        }
    });

    // Add event listener to remove button
    newExpenseGroup.querySelector('[data-remove-id]').addEventListener('click', (e) => {
        const idToRemove = e.target.dataset.removeId;
        const categoryToRemove = document.getElementById(`${idToRemove}Category`).value.trim();
        delete expensesData[categoryToRemove];
        newExpenseGroup.remove();
        showToast('Expense removed.', 'info');
    });
    showToast('Custom expense added. Fill in details.', 'info');
});

function generateBudget() {
    const income = parseFloat(document.getElementById('monthlyIncome').value) || 0;
    let totalExpenses = 0;

    // Sum up all expenses from the expensesData object
    for (const category in expensesData) {
        totalExpenses += expensesData[category];
    }

    const savings = income - totalExpenses;

    budgetLoading.classList.add('show');
    document.getElementById('budgetBtn').disabled = true;

    setTimeout(() => {
        budgetLoading.classList.remove('show');
        document.getElementById('budgetBtn').disabled = false;

        if (income <= 0) {
            showToast('Please enter a valid monthly income to generate a budget.', 'error');
            budgetChartCanvas.style.display = 'none';
            budgetAdvice.innerHTML = '';
            return;
        }

        budgetChartCanvas.style.display = 'block'; // Show canvas

        // Update dashboard savings (assuming expenses are part of overall financial health)
        userFinancialData.savings = savings;
        updateDashboardStats();

        // Prepare data for Chart.js
        const chartLabels = Object.keys(expensesData).filter(key => expensesData[key] > 0);
        const chartData = Object.values(expensesData).filter(value => value > 0);
        const chartColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9EE', '#C9CBCF', '#7B68EE', '#ADFF2F'
        ];

        if (budgetChartInstance) {
            budgetChartInstance.destroy(); // Destroy previous chart instance
        }

        budgetChartInstance = new Chart(budgetChartCanvas, {
            type: 'pie',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors.slice(0, chartLabels.length),
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'white' // Chart.js legend text color
                        }
                    },
                    title: {
                        display: true,
                        text: 'Monthly Expense Breakdown',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        color: 'white' // Chart.js title color
                    }
                }
            }
        });

        let adviceText = `
                    <p><strong>Income:</strong> ₹${income.toLocaleString('en-IN')}</p>
                    <p><strong>Total Expenses:</strong> ₹${totalExpenses.toLocaleString('en-IN')}</p>
                    <p><strong>Savings/Deficit:</strong> <span style="color: ${savings >= 0 ? '#4facfe' : '#fa709a'}; font-weight: 600;">₹${savings.toLocaleString('en-IN')}</span></p>
                `;

        if (savings > income * 0.2) {
            adviceText += `<p>Great job! You are saving a significant portion of your income. Consider investing some of your savings for long-term growth.</p>`;
        } else if (savings > 0) {
            adviceText += `<p>You are managing your expenses well and have some savings. Look for areas to optimize spending to increase your savings further.</p>`;
        } else {
            adviceText += `<p>It looks like your expenses exceed your income. Focus on reducing non-essential spending to improve your financial health. Review your largest expense categories in the chart above.</p>`;
        }
        budgetAdvice.innerHTML = adviceText;
        showToast('Budget analysis generated!', 'success');

    }, 1000);
}

// --- Investment Module Logic (Micro-investing) ---
const investmentResult = document.getElementById('investmentResult');
const investmentGrowthChartCanvas = document.getElementById('investmentGrowthChart');
const investNowBtn = document.getElementById('investNowBtn');
let investmentGrowthChartInstance = null;
let currentInvestmentAmount = 0; // Store the amount to be invested

function generateInvestmentSuggestions() {
    const dailyInvestmentAmount = parseFloat(document.getElementById('dailyInvestmentAmount').value) || 0;
    const riskLevel = document.getElementById('riskLevel').value;
    const investmentGoal = document.getElementById('investmentGoal').value;

    if (dailyInvestmentAmount < 10) {
        showToast('Daily investment amount must be at least ₹10.', 'error');
        return;
    }

    let suggestion = '';
    let monthlyInvestment = dailyInvestmentAmount * 30; // Monthly investment potential
    currentInvestmentAmount = monthlyInvestment; // Set for UPI payment
    let simulatedReturnRate = 0; // Annual percentage

    if (investmentGoal === 'emergency') {
        suggestion = `For an emergency fund, focus on low-risk, liquid options. Consider a **High-Yield Savings Account** or a **Liquid Mutual Fund**. Aim to build 3-6 months of living expenses.`;
        simulatedReturnRate = 5; // 5% annual return
    } else if (investmentGoal === 'retirement') {
        if (riskLevel === 'low') {
            suggestion = `For retirement with low risk, consider **Public Provident Fund (PPF)** or **Employee Provident Fund (EPF)**. These offer guaranteed returns and tax benefits.`;
            simulatedReturnRate = 7;
        } else if (riskLevel === 'medium') {
            suggestion = `For retirement with medium risk, explore **Balanced Advantage Funds** or **Equity Linked Savings Schemes (ELSS)** for tax savings and growth potential.`;
            simulatedReturnRate = 10;
        } else { // High risk
            suggestion = `For retirement with high risk and long-term growth, consider investing in **Diversified Equity Mutual Funds** via SIP (Systematic Investment Plan) or direct equity in blue-chip companies.`;
            simulatedReturnRate = 15;
        }
    } else if (investmentGoal === 'education') {
        if (riskLevel === 'low') {
            suggestion = `For education with low risk, consider **Sukanya Samriddhi Yojana (for girl child)** or **Debt Mutual Funds** for stable returns.`;
            simulatedReturnRate = 6;
        } else if (riskLevel === 'medium') {
            suggestion = `For education with medium risk, explore **Hybrid Mutual Funds** or **Children's Gift Funds** that balance equity and debt.`;
            simulatedReturnRate = 9;
        } else { // High risk
            suggestion = `For education with high risk and long-term horizon, consider **Equity Mutual Funds** focusing on growth sectors.`;
            simulatedReturnRate = 14;
        }
    } else if (investmentGoal === 'home') {
        if (riskLevel === 'low') {
            suggestion = `For a home purchase with low risk, focus on **Fixed Deposits** or **Debt Mutual Funds** to preserve capital.`;
            simulatedReturnRate = 6;
        } else if (riskLevel === 'medium') {
            suggestion = `For a home purchase with medium risk, consider **Balanced Funds** or **Real Estate Investment Trusts (REITs)** for exposure to real estate.`;
            simulatedReturnRate = 10;
        } else { // High risk
            suggestion = `For a home purchase with high risk, consider **Equity Mutual Funds** or direct investment in real estate stocks, but be aware of market volatility.`;
            simulatedReturnRate = 13;
        }
    }

    investmentResult.innerHTML = `
                <h4>Investment Suggestion for You:</h4>
                <p>Based on your daily investment of ₹${dailyInvestmentAmount.toLocaleString('en-IN')} (potential monthly investment of ₹${monthlyInvestment.toLocaleString('en-IN')}), your risk tolerance (${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}), and your goal (${investmentGoal.charAt(0).toUpperCase() + investmentGoal.slice(1)}):</p>
                <p>${suggestion}</p>
                <p style="margin-top: 15px; font-style: italic; color: rgba(255,255,255,0.7);">
                    <small>Disclaimer: This is AI-generated advice and not financial consultation. Please consult a certified financial advisor before making investment decisions.</small>
                </p>
            `;

    // Simulate investment growth over 5 years
    const years = 5;
    const monthlyInvestmentAmount = monthlyInvestment;
    const monthlyRate = simulatedReturnRate / 100 / 12;
    let principal = 0;
    const growthData = [];
    const labels = [];

    for (let i = 1; i <= years * 12; i++) {
        principal += monthlyInvestmentAmount;
        principal *= (1 + monthlyRate);
        if (i % 12 === 0) { // Record yearly data
            growthData.push(principal.toFixed(2));
            labels.push(`Year ${i / 12}`);
        }
    }

    if (investmentGrowthChartInstance) {
        investmentGrowthChartInstance.destroy();
    }

    investmentGrowthChartInstance = new Chart(investmentGrowthChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Simulated Investment Growth (₹)',
                data: growthData,
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#4facfe',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#4facfe'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'white'
                    }
                },
                title: {
                    display: true,
                    text: `Projected Growth over ${years} Years (${simulatedReturnRate}% Annual Return)`,
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: 'white'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Value (₹)',
                        color: 'rgba(255,255,255,0.7)'
                    },
                    ticks: {
                        color: 'rgba(255,255,255,0.7)'
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                        color: 'rgba(255,255,255,0.7)'
                    },
                    ticks: {
                        color: 'rgba(255,255,255,0.7)'
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                }
            }
        }
    });
    investNowBtn.style.display = 'block'; // Show invest now button
    showToast('Investment suggestions generated!', 'success');
}

// --- UPI Integration Logic ---
const upiPaymentModal = document.getElementById('upiPaymentModal');
const upiAmountInput = document.getElementById('upiAmount');
const upiIdInput = document.getElementById('upiId');
const payUpiBtn = document.getElementById('payUpiBtn');
const upiLoading = document.getElementById('upiLoading');
const upiPaymentStatus = document.getElementById('upiPaymentStatus');
const upiPaymentForm = document.getElementById('upiPaymentForm');

investNowBtn.addEventListener('click', () => {
    upiAmountInput.value = currentInvestmentAmount.toFixed(2); // Pre-fill amount
    upiPaymentStatus.textContent = ''; // Clear previous status
    upiLoading.style.display = 'none'; // Hide loading
    payUpiBtn.style.display = 'block'; // Show pay button
    openModal('upiPaymentModal');
});

upiPaymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(upiAmountInput.value);
    const upiId = upiIdInput.value.trim();

    if (amount <= 0 || !upiId) {
        showToast('Please enter a valid amount and UPI ID.', 'error');
        return;
    }

    upiLoading.style.display = 'block';
    payUpiBtn.style.display = 'none';
    upiPaymentStatus.textContent = '';

    // Simulate UPI payment processing
    setTimeout(() => {
        upiLoading.style.display = 'none';
        const isSuccess = Math.random() > 0.1; // 90% chance of success

        if (isSuccess) {
            upiPaymentStatus.textContent = `Payment of ₹${amount.toLocaleString('en-IN')} successful!`;
            upiPaymentStatus.className = 'upi-payment-status success';
            userFinancialData.investments += amount; // Update investments
            userFinancialData.savings -= amount; // Deduct from savings (simulated)
            updateDashboardStats();
            showToast('Investment successful via UPI!', 'success');
            // Optionally close modal after a delay
            setTimeout(() => closeModal('upiPaymentModal'), 2000);
        } else {
            upiPaymentStatus.textContent = 'Payment failed. Please try again.';
            upiPaymentStatus.className = 'upi-payment-status failed';
            payUpiBtn.style.display = 'block'; // Allow retry
            showToast('UPI payment failed.', 'error');
        }
    }, 3000); // Simulate 3-second payment processing
});



