
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
} = require("../controllers/transactionController");

// All routes are protected
router.use(protect);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;
