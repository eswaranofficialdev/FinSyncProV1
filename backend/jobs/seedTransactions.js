const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const Transaction = require("../models/Transaction");
const User = require("../models/User");

const transactions = [
  // 1
  {
    type: "expense",
    category: "Food",
    amount: 450,
    date: "2026-01-05T12:30:00.000Z",
    description: "Lunch at restaurant",
    paymentMode: "UPI",
    status: "completed",
    tags: ["food", "lunch"],
    isRecurring: false,
    isPinned: false,
  },

  // 2
  {
    type: "income",
    category: "Salary",
    amount: 55000,
    date: "2026-01-31T09:00:00.000Z",
    description: "January salary",
    paymentMode: "Bank Transfer",
    status: "completed",
    tags: ["salary", "income"],
    isRecurring: true,
    recurringFrequency: "monthly",
    isPinned: true,
  },

  // 3
  {
    type: "expense",
    category: "Travel",
    amount: 280,
    date: "2026-02-03T08:15:00.000Z",
    description: "Cab ride to office",
    paymentMode: "UPI",
    status: "completed",
    tags: ["travel", "office"],
    isRecurring: false,
    isPinned: false,
  },

  // 4
  {
    type: "expense",
    category: "Shopping",
    amount: 2499,
    date: "2026-02-10T16:45:00.000Z",
    description: "New pair of shoes",
    paymentMode: "Card",
    status: "completed",
    tags: ["shopping", "clothing"],
    isRecurring: false,
    isPinned: false,
  },

  // 5
  {
    type: "expense",
    category: "Bills",
    amount: 1299,
    date: "2026-02-15T10:00:00.000Z",
    description: "Internet bill",
    paymentMode: "UPI",
    status: "completed",
    tags: ["internet", "bill"],
    isRecurring: true,
    recurringFrequency: "monthly",
    isPinned: true,
  },

  // 6
  {
    type: "income",
    category: "Others",
    amount: 8500,
    date: "2026-02-20T14:30:00.000Z",
    description: "Freelance web development payment",
    paymentMode: "Bank Transfer",
    status: "completed",
    tags: ["freelance", "work"],
    isRecurring: false,
    isPinned: false,
  },

  // 7
  {
    type: "expense",
    category: "Entertainment",
    amount: 699,
    date: "2026-02-25T19:30:00.000Z",
    description: "Movie tickets",
    paymentMode: "Card",
    status: "completed",
    tags: ["movie", "entertainment"],
    isRecurring: false,
    isPinned: false,
  },

  // 8
  {
    type: "expense",
    category: "Food",
    amount: 3250,
    date: "2026-03-02T11:20:00.000Z",
    description: "Monthly groceries",
    paymentMode: "Card",
    status: "completed",
    tags: ["groceries", "home"],
    isRecurring: false,
    isPinned: false,
  },

  // 9
  {
    type: "expense",
    category: "Health",
    amount: 1200,
    date: "2026-03-08T17:00:00.000Z",
    description: "Pharmacy purchase",
    paymentMode: "UPI",
    status: "completed",
    tags: ["health", "medical"],
    isRecurring: false,
    isPinned: false,
  },

  // 10
  {
    type: "income",
    category: "Salary",
    amount: 55000,
    date: "2026-03-31T09:00:00.000Z",
    description: "February salary",
    paymentMode: "Bank Transfer",
    status: "completed",
    tags: ["salary", "income"],
    isRecurring: true,
    recurringFrequency: "monthly",
    isPinned: true,
  },

  // 11
  {
    type: "expense",
    category: "Food",
    amount: 850,
    date: "2026-04-04T13:15:00.000Z",
    description: "Dinner with friends",
    paymentMode: "UPI",
    status: "completed",
    tags: ["food", "friends"],
    isRecurring: false,
    isPinned: false,
  },

  // 12
  {
    type: "expense",
    category: "Bills",
    amount: 1850,
    date: "2026-04-12T10:30:00.000Z",
    description: "Electricity bill",
    paymentMode: "UPI",
    status: "completed",
    tags: ["electricity", "bill"],
    isRecurring: true,
    recurringFrequency: "monthly",
    isPinned: false,
  },

  // 13
  {
    type: "expense",
    category: "Education",
    amount: 4500,
    date: "2026-04-18T15:00:00.000Z",
    description: "Online programming course",
    paymentMode: "Card",
    status: "completed",
    tags: ["education", "course"],
    isRecurring: false,
    isPinned: false,
  },

  // 14
  {
    type: "income",
    category: "Others",
    amount: 12000,
    date: "2026-05-06T11:45:00.000Z",
    description: "Freelance project payment",
    paymentMode: "Bank Transfer",
    status: "completed",
    tags: ["freelance", "project"],
    isRecurring: false,
    isPinned: false,
  },

  // 15
  {
    type: "expense",
    category: "Travel",
    amount: 3200,
    date: "2026-05-14T09:30:00.000Z",
    description: "Fuel and transportation expenses",
    paymentMode: "Card",
    status: "completed",
    tags: ["fuel", "travel"],
    isRecurring: false,
    isPinned: false,
  },

  // 16
  {
    type: "investment",
    category: "Investment",
    amount: 5999,
    date: "2026-05-22T18:20:00.000Z",
    description: "Monthly mutual fund investment",
    paymentMode: "Bank Transfer",
    status: "completed",
    tags: ["investment", "mutual-fund"],
    isRecurring: true,
    recurringFrequency: "monthly",
    isPinned: true,
  },

  // 17
  {
    type: "expense",
    category: "Rent",
    amount: 18000,
    date: "2026-06-01T08:00:00.000Z",
    description: "Monthly house rent",
    paymentMode: "Bank Transfer",
    status: "completed",
    tags: ["rent", "home"],
    isRecurring: true,
    recurringFrequency: "monthly",
    isPinned: true,
  },

  // 18
  {
    type: "expense",
    category: "Travel",
    amount: 7500,
    date: "2026-06-15T07:30:00.000Z",
    description: "Weekend trip expenses",
    paymentMode: "Card",
    status: "completed",
    tags: ["travel", "trip"],
    isRecurring: false,
    isPinned: false,
  },

  // 19
  {
    type: "loan",
    category: "Loan",
    amount: 10000,
    date: "2026-07-03T10:00:00.000Z",
    description: "Personal loan repayment",
    paymentMode: "Bank Transfer",
    status: "completed",
    tags: ["loan", "repayment"],
    isRecurring: false,
    isPinned: false,
  },

  // 20
  {
    type: "savings",
    category: "Savings",
    amount: 5000,
    date: "2026-07-25T16:00:00.000Z",
    description: "Monthly savings contribution",
    paymentMode: "Bank Transfer",
    status: "completed",
    tags: ["savings", "monthly"],
    isRecurring: true,
    recurringFrequency: "monthly",
    isPinned: true,
  },
];

const seedTransactions = async () => {
  try {
    // ------------------------------------------
    // CONNECT TO MONGODB
    // ------------------------------------------
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected\n");

    // ------------------------------------------
    // FIND USER
    // ------------------------------------------
    const user = await User.findOne();

    if (!user) {
      console.log("No user found.");
      console.log("Please create a user first.");
      process.exit(1);
    }

    console.log(`Using user: ${user._id}\n`);

    // ------------------------------------------
    // DELETE OLD TRANSACTIONS FOR THIS USER
    // ------------------------------------------
    const deleted = await Transaction.deleteMany({
      owner: user._id,
    });

    console.log(`Deleted ${deleted.deletedCount} old transactions\n`);

    // ------------------------------------------
    // CREATE TRANSACTIONS
    // ------------------------------------------
    const transactionsWithOwner = transactions.map(
      (transaction, index) => ({
        ...transaction,

        // Required fields
        transactionNumber: `SEED-TXN-${String(index + 1).padStart(6, "0")}`,
        owner: user._id,
        community: null,

        // Optional fields
        receipt: {
          url: "",
          publicId: "",
        },

        splitAmong: [],
        reminder: null,
      })
    );

    // ------------------------------------------
    // INSERT
    // ------------------------------------------
    const createdTransactions = await Transaction.insertMany(
      transactionsWithOwner
    );

    console.log(
      `Successfully inserted ${createdTransactions.length} transactions\n`
    );

    // ------------------------------------------
    // DISPLAY INSERTED DATA
    // ------------------------------------------
    createdTransactions.forEach((transaction, index) => {
      console.log(
        `${index + 1}. ${transaction.transactionNumber} | ` +
          `${transaction.type} | ` +
          `${transaction.category} | ` +
          `₹${transaction.amount} | ` +
          `${transaction.date.toISOString().split("T")[0]}`
      );
    });

    console.log("\n------------------------------------------");
    console.log("Transaction seeding completed successfully!");
    console.log("------------------------------------------\n");

    // ------------------------------------------
    // CLOSE CONNECTION
    // ------------------------------------------
    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("\nSeed error:", error);

    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error("Error closing MongoDB:", closeError);
    }

    process.exit(1);
  }
};

seedTransactions();