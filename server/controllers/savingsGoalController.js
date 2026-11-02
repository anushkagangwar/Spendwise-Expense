const mongoose = require("mongoose");
const SavingsGoal = require("../models/SavingsGoal");

// CREATE A NEW GOAL
const createGoal = async (req, res) => {
  try {
    const { name, category, targetAmount, savedAmount, targetDate } = req.body;

    const target = Number(targetAmount);
    const saved = Number(savedAmount ?? 0);

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Goal name is required.",
      });
    }

    if (!Number.isFinite(target) || target <= 0) {
      return res.status(400).json({
        success: false,
        message: "Target amount must be greater than zero.",
      });
    }

    if (!Number.isFinite(saved) || saved < 0 || saved > target) {
      return res.status(400).json({
        success: false,
        message: "Saved amount must be between zero and target amount.",
      });
    }

    const goal = await SavingsGoal.create({
      userId: req.user.id,
      name: name.trim(),
      category: category || "Personal",
      targetAmount: target,
      savedAmount: saved,
      targetDate: targetDate || "",
    });

    return res.status(201).json({
      success: true,
      message: "Savings goal created successfully.",
      goal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create savings goal.",
      error: error.message,
    });
  }
};

// GET ALL GOALS OF LOGGED-IN USER
const getGoals = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: goals.length,
      goals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch savings goals.",
      error: error.message,
    });
  }
};

// UPDATE A GOAL
const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, targetAmount, savedAmount, targetDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID.",
      });
    }

    const goal = await SavingsGoal.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found.",
      });
    }

    const target =
      targetAmount !== undefined ? Number(targetAmount) : goal.targetAmount;

    const saved =
      savedAmount !== undefined ? Number(savedAmount) : goal.savedAmount;

    if (!Number.isFinite(target) || target <= 0) {
      return res.status(400).json({
        success: false,
        message: "Target amount must be greater than zero.",
      });
    }

    if (!Number.isFinite(saved) || saved < 0 || saved > target) {
      return res.status(400).json({
        success: false,
        message: "Saved amount must be between zero and target amount.",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Goal name cannot be empty.",
        });
      }
      goal.name = name.trim();
    }

    if (category !== undefined) goal.category = category;
    if (targetAmount !== undefined) goal.targetAmount = target;
    if (savedAmount !== undefined) goal.savedAmount = saved;
    if (targetDate !== undefined) goal.targetDate = targetDate || "";

    await goal.save();

    return res.status(200).json({
      success: true,
      message: "Savings goal updated successfully.",
      goal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update savings goal.",
      error: error.message,
    });
  }
};

// ADD MONEY TO A GOAL
const addMoney = async (req, res) => {
  try {
    const { id } = req.params;
    const amount = Number(req.body.amount);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID.",
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter an amount greater than zero.",
      });
    }

    // Atomic update: only add money if the target will not be exceeded.
    const goal = await SavingsGoal.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        $expr: {
          $lte: [
            { $add: ["$savedAmount", amount] },
            "$targetAmount",
          ],
        },
      },
      {
        $inc: { savedAmount: amount },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!goal) {
      const existingGoal = await SavingsGoal.findOne({
        _id: id,
        userId: req.user.id,
      });

      if (!existingGoal) {
        return res.status(404).json({
          success: false,
          message: "Savings goal not found.",
        });
      }

      const remaining = Math.max(
        existingGoal.targetAmount - existingGoal.savedAmount,
        0
      );

      return res.status(400).json({
        success: false,
        message:
          remaining <= 0
            ? "This goal is already completed."
            : `You can add up to ₹${remaining} to this goal.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Money added successfully.",
      goal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add money.",
      error: error.message,
    });
  }
};

// DELETE A GOAL
const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID.",
      });
    }

    const goal = await SavingsGoal.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Savings goal deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete savings goal.",
      error: error.message,
    });
  }
};

module.exports = {
  createGoal,
  getGoals,
  updateGoal,
  addMoney,
  deleteGoal,
};