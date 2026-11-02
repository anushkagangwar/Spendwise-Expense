
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: [true, "Transaction title is required"],
      trim: true
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than zero"]
    },

    type: {
      type: String,
      enum: ["Income", "Expense"],
      required: true
    },

    date: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
