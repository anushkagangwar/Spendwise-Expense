
import { useEffect, useState } from "react";


import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  X,
  Utensils,
  ShoppingBag,
  Car,
  Receipt,
  Heart,
  MoreHorizontal,
} from "lucide-react";
import "../styles/budget.css";

const API_URL = "https://spendwise-expense-31h4.onrender.com/api";

const iconMap = {
  food: Utensils,
  shopping: ShoppingBag,
  travel: Car,
  bills: Receipt,
  health: Heart,
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const initialForm = {
  category: "",
  limit: "",
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getToken = () =>
  localStorage.getItem("spendwiseAuthToken") ||
  sessionStorage.getItem("spendwiseAuthToken");

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const getIconName = (category) => {
  const normalized = category.trim().toLowerCase();

  if (["food", "food & dining", "dining"].includes(normalized)) {
    return "food";
  }

  if (["shopping", "clothing"].includes(normalized)) {
    return "shopping";
  }

  if (
    ["transportation", "transport", "travel"].includes(normalized)
  ) {
    return "travel";
  }

  if (
    ["bills", "bills & utilities", "utilities"].includes(normalized)
  ) {
    return "bills";
  }

  if (["health", "medical"].includes(normalized)) {
    return "health";
  }

  return "other";
};

function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const currentMonth = getCurrentMonth();

  const currentMonthLabel = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Normalize category names so similar categories match.
  const normalizeCategory = (value = "") => {
    const normalized = value.trim().toLowerCase();

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

    return aliases[normalized] || normalized;
  };

  // Fetch budgets and transactions from MongoDB.
  const fetchBudgetData = async () => {
    const token = getToken();

    if (!token) {
      setPageError("Your session has expired. Please login again.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setPageError("");

      const [budgetResponse, transactionResponse] = await Promise.all([
        fetch(`${API_URL}/budgets`, {
          method: "GET",
          headers: getAuthHeaders(),
        }),
        fetch(`${API_URL}/transactions`, {
          method: "GET",
          headers: getAuthHeaders(),
        }),
      ]);

      const budgetData = await budgetResponse.json();
      const transactionData = await transactionResponse.json();

      if (!budgetResponse.ok) {
        throw new Error(
          budgetData.message || "Unable to fetch budgets."
        );
      }

      if (!transactionResponse.ok) {
        throw new Error(
          transactionData.message || "Unable to fetch transactions."
        );
      }

      const fetchedBudgets =
        budgetData.budgets || budgetData.data || [];

      const fetchedTransactions =
        transactionData.transactions || transactionData.data || [];

      // Show only the budgets for the current month.
      const monthlyBudgets = fetchedBudgets
        .filter((item) => item.month === currentMonth)
        .map((item) => ({
          ...item,
          id: item._id,
          icon: getIconName(item.category),
          limit: Number(item.limit),
        }));

      setBudgets(monthlyBudgets);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Budget data error:", error);
      setPageError(error.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, []);

  // Calculate spending from actual expense transactions.
  const budgetsWithLiveSpent = budgets.map((budget) => {
    const spent = transactions
      .filter((item) => {
        const transactionMonth = item.date
          ? String(item.date).slice(0, 7)
          : "";

        return (
          item.type?.toLowerCase() === "expense" &&
          transactionMonth === currentMonth &&
          normalizeCategory(item.category) ===
            normalizeCategory(budget.category)
        );
      })
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      ...budget,
      spent,
    };
  });

  // Summary calculations.
  const totalBudget = budgets.reduce(
    (sum, item) => sum + Number(item.limit || 0),
    0
  );

  const totalSpent = budgetsWithLiveSpent.reduce(
    (sum, item) => sum + item.spent,
    0
  );

  const remaining = totalBudget - totalSpent;

  const usedPercentage =
    totalBudget > 0
      ? Math.round((totalSpent / totalBudget) * 100)
      : 0;

  // Open add budget modal.
  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  // Open edit budget modal.
  const openEditModal = (budget) => {
    setEditingId(budget.id);

    setFormData({
      category: budget.category,
      limit: String(budget.limit),
    });

    setIsModalOpen(true);
  };

  // Create or update budget through API.
  const handleSubmit = async (e) => {
    e.preventDefault();

    const category = formData.category.trim();
    const limit = Number(formData.limit);

    if (!category || !Number.isFinite(limit) || limit <= 0) {
      alert("Please enter a valid category and budget amount.");
      return;
    }

    const categoryAlreadyExists = budgets.some(
      (item) =>
        item.id !== editingId &&
        normalizeCategory(item.category) === normalizeCategory(category)
    );

    if (categoryAlreadyExists) {
      alert(
        "A budget for this category already exists. Please edit the existing budget."
      );
      return;
    }

    try {
      setIsSaving(true);

      const isEditing = Boolean(editingId);

      const url = isEditing
        ? `${API_URL}/budgets/${editingId}`
        : `${API_URL}/budgets`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          category,
          limit,
          month: currentMonth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save budget.");
      }

      await fetchBudgetData();

      setIsModalOpen(false);
      setFormData(initialForm);
      setEditingId(null);
    } catch (error) {
      console.error("Save budget error:", error);
      alert(error.message || "Unable to save budget.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete budget through API.
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/budgets/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete budget.");
      }

      setBudgets((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Delete budget error:", error);
      alert(error.message || "Unable to delete budget.");
    }
  };

  return (
    <div className="budget-page">
      <div className="budget-header">
        <div>
          <span className="budget-eyebrow">FINANCIAL PLANNING</span>
          <h1>My Budgets</h1>
          <p>Set spending limits and stay in control of your money.</p>
        </div>

        <button className="budget-add-btn" onClick={openAddModal}>
          <Plus size={18} />
          Add Budget
        </button>
      </div>

      {pageError && (
        <div className="budget-error-message" role="alert">
          {pageError}
          <button onClick={fetchBudgetData}>Retry</button>
        </div>
      )}

      {isLoading ? (
        <div className="budget-loading">
          <div className="budget-loader" />
          <p>Loading your budgets...</p>
        </div>
      ) : (
        <>
          <div className="budget-summary-grid">
            <div className="budget-summary-card">
              <div className="budget-summary-top">
                <span>Total Budget</span>
                <div className="budget-summary-icon purple">
                  <Wallet size={20} />
                </div>
              </div>
              <h2>{formatCurrency(totalBudget)}</h2>
              <p>Your planned monthly spending</p>
            </div>

            <div className="budget-summary-card">
              <div className="budget-summary-top">
                <span>Total Spent</span>
                <div className="budget-summary-icon coral">
                  <TrendingUp size={20} />
                </div>
              </div>
              <h2>{formatCurrency(totalSpent)}</h2>
              <p>{usedPercentage}% of your total budget used</p>
            </div>

            <div className="budget-summary-card">
              <div className="budget-summary-top">
                <span>Remaining</span>
                <div className="budget-summary-icon green">
                  <TrendingDown size={20} />
                </div>
              </div>
              <h2 className={remaining < 0 ? "negative-amount" : ""}>
                {formatCurrency(remaining)}
              </h2>
              <p>
                {remaining < 0
                  ? "You are over your budget"
                  : "Available to spend"}
              </p>
            </div>
          </div>

          <section className="budget-overview-card">
            <div className="budget-overview-heading">
              <div>
                <h2>Monthly Budget Overview</h2>
                <p>Your overall spending progress</p>
              </div>
              <span className="budget-month-label">
                {currentMonthLabel}
              </span>
            </div>

            <div className="budget-overview-amounts">
              <div>
                <span>Spent so far</span>
                <h3>{formatCurrency(totalSpent)}</h3>
              </div>
              <div className="budget-overview-right">
                <span>Total limit</span>
                <h3>{formatCurrency(totalBudget)}</h3>
              </div>
            </div>

            <div className="budget-progress-track overall-progress">
              <div
                className={`budget-progress-fill ${
                  usedPercentage > 100 ? "over-budget" : ""
                }`}
                style={{
                  width: `${Math.min(usedPercentage, 100)}%`,
                }}
              />
            </div>

            <div className="budget-overview-footer">
              <span>{usedPercentage}% used</span>
              <span>{formatCurrency(Math.max(remaining, 0))} left</span>
            </div>
          </section>

          <section className="category-budget-section">
            <div className="category-budget-heading">
              <div>
                <h2>Category Budgets</h2>
                <p>Track your spending category by category.</p>
              </div>
              <span>{budgets.length} categories</span>
            </div>

            <div className="category-budget-grid">
              {budgetsWithLiveSpent.map((budget) => {
                const Icon = iconMap[budget.icon] || MoreHorizontal;

                const percentage =
                  budget.limit > 0
                    ? Math.round((budget.spent / budget.limit) * 100)
                    : 0;

                const isOverBudget = percentage > 100;

                return (
                  <div className="category-budget-card" key={budget.id}>
                    <div className="category-budget-top">
                      <div className="category-icon-box">
                        <Icon size={20} />
                      </div>

                      <div className="category-budget-actions">
                        <button
                          aria-label={`Edit ${budget.category}`}
                          onClick={() => openEditModal(budget)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          aria-label={`Delete ${budget.category}`}
                          onClick={() => handleDelete(budget.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <h3>{budget.category}</h3>

                    <div className="category-budget-amounts">
                      <div>
                        <strong>{formatCurrency(budget.spent)}</strong>
                        <span>Spent</span>
                      </div>

                      <div className="category-budget-limit">
                        <strong>{formatCurrency(budget.limit)}</strong>
                        <span>Budget limit</span>
                      </div>
                    </div>

                    <div className="budget-progress-track">
                      <div
                        className={`budget-progress-fill ${
                          isOverBudget ? "over-budget" : ""
                        }`}
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                      />
                    </div>

                    <div className="category-budget-footer">
                      <span
                        className={
                          isOverBudget ? "over-budget-text" : ""
                        }
                      >
                        {percentage}% used
                      </span>

                      <span>
                        {isOverBudget
                          ? `${formatCurrency(
                              budget.spent - budget.limit
                            )} over`
                          : `${formatCurrency(
                              budget.limit - budget.spent
                            )} left`}
                      </span>
                    </div>

                    {isOverBudget && (
                      <div className="budget-warning">
                        <TrendingUp size={14} />
                        Budget limit exceeded
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {budgets.length === 0 && (
              <div className="budget-empty-state">
                <Wallet size={35} />
                <h3>No budgets yet</h3>
                <p>
                  Create your first category budget to start tracking
                  expenses.
                </p>
                <button onClick={openAddModal}>Create Budget</button>
              </div>
            )}
          </section>
        </>
      )}

      {isModalOpen && (
        <div
          className="budget-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              setIsModalOpen(false);
            }
          }}
        >
          <div
            className="budget-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-modal-title"
          >
            <div className="budget-modal-header">
              <div>
                <h2 id="budget-modal-title">
                  {editingId ? "Edit Budget" : "Create New Budget"}
                </h2>
                <p>Set a spending limit for a category.</p>
              </div>

              <button
                className="budget-modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="budget-form-group">
                <label htmlFor="budget-category">Category name</label>
                <input
                  id="budget-category"
                  type="text"
                  placeholder="e.g. Food & Dining"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="budget-form-group">
                <label htmlFor="budget-limit">
                  Monthly budget amount (₹)
                </label>
                <input
                  id="budget-limit"
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={formData.limit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limit: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="budget-modal-actions">
                <button
                  type="button"
                  className="budget-cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="budget-save-btn"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Create Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budget;
