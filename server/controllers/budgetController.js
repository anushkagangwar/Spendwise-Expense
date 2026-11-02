
const Budget = require("../models/Budget");

// @desc    Create a new budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res) => {
  try {
    const { category, limit, month } = req.body;

    if (!category?.trim() || !limit || !month) {
      return res.status(400).json({
        success: false,
        message: "Category, limit and month are required.",
      });
    }

    const budgetLimit = Number(limit);

    if (!Number.isFinite(budgetLimit) || budgetLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Budget limit must be greater than zero.",
      });
    }

    const existingBudget = await Budget.findOne({
      userId: req.user.id,
      category: category.trim(),
      month,
    });

    if (existingBudget) {
      return res.status(409).json({
        success: false,
        message: "A budget for this category already exists for this month.",
      });
    }

    const budget = await Budget.create({
      userId: req.user.id,
      category: category.trim(),
      limit: budgetLimit,
      month,
    });

    return res.status(201).json({
      success: true,
      message: "Budget created successfully.",
      budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget for this category already exists for this month.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create budget.",
    });
  }
};

// @desc    Get all budgets for logged-in user
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({
      userId: req.user.id,
    }).sort({ month: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: budgets.length,
      budgets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch budgets.",
    });
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res) => {
  try {
    const { category, limit, month } = req.body;
    const updates = {};

    if (category !== undefined) {
      if (!category.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be empty.",
        });
      }
      updates.category = category.trim();
    }

    if (limit !== undefined) {
      const budgetLimit = Number(limit);

      if (!Number.isFinite(budgetLimit) || budgetLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: "Budget limit must be greater than zero.",
        });
      }

      updates.limit = budgetLimit;
    }

    if (month !== undefined) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid month in YYYY-MM format.",
        });
      }
      updates.month = month;
    }

    const budget = await Budget.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully.",
      budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget for this category already exists for this month.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update budget.",
    });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete budget.",
    });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};
