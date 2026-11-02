
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

// All budget routes require authentication
router.use(protect);

router.post("/", createBudget);
router.get("/", getBudgets);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
