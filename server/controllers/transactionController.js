
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

// Normalize category names for matching
const normalizeCategory = (value = "") => {
  const category = String(value).trim().toLowerCase();

  const aliases = {
    "food & dining": "food",
    dining: "food",
    "bills & utilities": "bills",
    utilities: "bills",
    transport: "transportation",
    travel: "transportation",
    clothing: "shopping",
    medical: "health",
  };

  return aliases[category] || category;
};


// Validate expense against the user's monthly budget
const validateExpenseBudget = async ({
  userId,
  category,
  amount,
  date,
  excludeTransactionId = null,
}) => {
  const transactionDate = new Date(date);

  if (Number.isNaN(transactionDate.getTime())) {
    return {
      valid: false,
      message: "Please provide a valid transaction date.",
    };
  }

  // Get transaction month in YYYY-MM format
  const month = String(date).slice(0, 7);

  // Validate YYYY-MM format
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return {
      valid: false,
      message: "Invalid transaction month.",
    };
  }

  // Find all budgets for this user and month
  const budgets = await Budget.find({
    userId,
    month,
  });

  // Match category, including supported aliases
  const matchingBudget = budgets.find(
    (budget) =>
      normalizeCategory(budget.category) ===
      normalizeCategory(category)
  );

  if (!matchingBudget) {
    return {
      valid: false,
      message: `No budget found for "${category}" in ${month}. Please create a budget first.`,
    };
  }

  // Calculate the beginning and end of the selected month
  const startDate = new Date(`${month}-01T00:00:00.000Z`);

  const [year, monthNumber] = month.split("-").map(Number);

  const endDate = new Date(
    Date.UTC(year, monthNumber, 1)
  );

  // Fetch existing expenses in that month
  const existingExpenses = await Transaction.find({
    userId,
    type: "Expense",
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  });

  // Calculate spending in the same category
  // Exclude the transaction being edited
  const alreadySpent = existingExpenses
    .filter((transaction) => {
      const sameCategory =
        normalizeCategory(transaction.category) ===
        normalizeCategory(category);

      const notBeingEdited =
        !excludeTransactionId ||
        transaction._id.toString() !==
          excludeTransactionId.toString();

      return sameCategory && notBeingEdited;
    })
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  const budgetLimit = Number(matchingBudget.limit);
  const newTotal = alreadySpent + amount;

  if (newTotal > budgetLimit) {
    return {
      valid: false,
      message: "Budget limit exceeded! Transaction was not saved.",
      budgetDetails: {
        category: matchingBudget.category,
        budgetLimit,
        alreadySpent,
        newExpense: amount,
        projectedSpending: newTotal,
        exceededAmount: newTotal - budgetLimit,
      },
    };
  }

  return {
    valid: true,
    budgetDetails: {
      category: matchingBudget.category,
      budgetLimit,
      alreadySpent,
      projectedSpending: newTotal,
    },
  };
};


// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
  try {
    const { title, category, amount, type, date } = req.body;

    if (
      !title?.trim() ||
      !category?.trim() ||
      amount === undefined ||
      !type ||
      !date
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required transaction details.",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid number greater than zero.",
      });
    }

    const normalizedType = String(type).toLowerCase();

    if (!["income", "expense"].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Transaction type must be Income or Expense.",
      });
    }

    const finalType =
      normalizedType === "income" ? "Income" : "Expense";

    // Check budget before saving an expense
    if (finalType === "Expense") {
      const budgetCheck = await validateExpenseBudget({
        userId: req.user.id,
        category: category.trim(),
        amount: numericAmount,
        date,
      });

      if (!budgetCheck.valid) {
        return res.status(400).json({
          success: false,
          message: budgetCheck.message,
          budgetDetails: budgetCheck.budgetDetails || null,
        });
      }
    }

    // Save transaction only after successful validation
    const transaction = await Transaction.create({
      userId: req.user.id,
      title: title.trim(),
      category: category.trim(),
      amount: numericAmount,
      type: finalType,
      date,
    });

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully.",
      transaction,
    });

  } catch (error) {
    console.error("Create transaction error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc    Get all transactions of logged-in user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id,
    }).sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });

  } catch (error) {
    console.error("Get transactions error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });
    }

    const existingTransaction = await Transaction.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    const { title, category, amount, type, date } = req.body;

    // Merge old and new values
    const finalTitle =
      title !== undefined ? title.trim() : existingTransaction.title;

    const finalCategory =
      category !== undefined
        ? category.trim()
        : existingTransaction.category;

    const finalAmount =
      amount !== undefined
        ? Number(amount)
        : Number(existingTransaction.amount);

    const finalDate =
      date !== undefined ? date : existingTransaction.date;

    let finalType = existingTransaction.type;

    if (type !== undefined) {
      const normalizedType = String(type).toLowerCase();

      if (!["income", "expense"].includes(normalizedType)) {
        return res.status(400).json({
          success: false,
          message: "Transaction type must be Income or Expense.",
        });
      }

      finalType =
        normalizedType === "income" ? "Income" : "Expense";
    }

    if (
      !finalTitle ||
      !finalCategory ||
      !Number.isFinite(finalAmount) ||
      finalAmount <= 0 ||
      !finalDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid transaction details.",
      });
    }

    // Validate updated expense before saving
    if (finalType === "Expense") {
      const budgetCheck = await validateExpenseBudget({
        userId: req.user.id,
        category: finalCategory,
        amount: finalAmount,
        date: finalDate,
        excludeTransactionId: id,
      });

      if (!budgetCheck.valid) {
        return res.status(400).json({
          success: false,
          message: budgetCheck.message,
          budgetDetails: budgetCheck.budgetDetails || null,
        });
      }
    }

    // Update only after successful validation
    existingTransaction.title = finalTitle;
    existingTransaction.category = finalCategory;
    existingTransaction.amount = finalAmount;
    existingTransaction.type = finalType;
    existingTransaction.date = finalDate;

    const transaction = await existingTransaction.save();

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully.",
      transaction,
    });

  } catch (error) {
    console.error("Update transaction error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
    });

  } catch (error) {
    console.error("Delete transaction error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};
