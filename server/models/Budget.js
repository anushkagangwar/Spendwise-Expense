
const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    limit: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [0.01, "Budget must be greater than zero"],
    },

    month: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// One budget per category per month for each user
budgetSchema.index(
  { userId: 1, category: 1, month: 1 },
  { unique: true }
);

const Budget = mongoose.model("Budget", budgetSchema);

module.exports = Budget;
