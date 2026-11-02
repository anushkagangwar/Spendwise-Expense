const mongoose = require("mongoose");

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Goal name is required"],
      trim: true,
      maxlength: 50,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      default: "Personal",
    },

    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [1, "Target amount must be greater than zero"],
    },

    savedAmount: {
      type: Number,
      default: 0,
      min: [0, "Saved amount cannot be negative"],
    },

    // Stored as YYYY-MM-DD to match the date input in the frontend.
    targetDate: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

savingsGoalSchema.index({ userId: 1, createdAt: -1 });

const SavingsGoal = mongoose.model("SavingsGoal", savingsGoalSchema);

module.exports = SavingsGoal;