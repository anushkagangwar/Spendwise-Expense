const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createGoal,
  getGoals,
  updateGoal,
  addMoney,
  deleteGoal,
} = require("../controllers/savingsGoalController");

// All routes require login
router.use(protect);

router.post("/", createGoal);
router.get("/", getGoals);
router.put("/:id", updateGoal);
router.patch("/:id/add-money", addMoney);
router.delete("/:id", deleteGoal);

module.exports = router;