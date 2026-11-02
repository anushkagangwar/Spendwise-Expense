
import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  MoreVertical,
  X,
  Pencil,
  Trash2,
  Wallet,
  Filter,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import "../styles/transactions.css";

// API URLs
const API_URL =
  "https://spendwise-expense-31h4.onrender.com/api/transactions";

const BUDGET_API_URL =
  "https://spendwise-expense-31h4.onrender.com/api/budgets";

// Authentication token
const getToken = () =>
  localStorage.getItem("spendwiseAuthToken") ||
  sessionStorage.getItem("spendwiseAuthToken");

// Common authentication headers
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const initialForm = {
  title: "",
  category: "",
  amount: "",
  type: "Expense",
  date: new Date().toISOString().split("T")[0],
};

function Transactions() {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // API states
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  // Transaction form
  const [formData, setFormData] = useState(initialForm);

  // Safely parse API response
  const parseResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const responseText = await response.text();

      console.error("Non-JSON API response:", responseText);

      throw new Error(
        `Server returned an invalid response (HTTP ${response.status}). Please check the API endpoint.`
      );
    }

    return response.json();
  };

  // Fetch transactions from MongoDB
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setApiError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please login again to view transactions.");
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch transactions."
        );
      }

      const formattedTransactions = (data.transactions || []).map(
        (item) => ({
          ...item,
          id: item._id,
          amount: Number(item.amount),
          date: item.date
            ? new Date(item.date).toISOString().slice(0, 10)
            : "",
        })
      );

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error("Fetch transactions error:", error);
      setApiError(error.message || "Unable to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Format currency
  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

  // Normalize category names for budget matching
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

  // Calculate summary
  const totalIncome = transactions
    .filter((item) => item.type === "Income")
    .reduce(
      (total, item) => total + Number(item.amount),
      0
    );

  const totalExpense = transactions
    .filter((item) => item.type === "Expense")
    .reduce(
      (total, item) => total + Number(item.amount),
      0
    );

  // Categories for filter
  const categories = [
    "All",
    ...new Set(transactions.map((item) => item.category)),
  ];

  // Search and filter
  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      activeFilter === "All" || item.type === activeFilter;

    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Open add modal
  const openAddModal = () => {
    setEditingId(null);

    setFormData({
      ...initialForm,
      date: new Date().toISOString().split("T")[0],
    });

    setApiError("");
    setIsModalOpen(true);
    setMenuOpen(null);
  };

  // Open edit modal
  const openEditModal = (transaction) => {
    setEditingId(transaction.id);

    setFormData({
      title: transaction.title,
      category: transaction.category,
      amount: String(transaction.amount),
      type: transaction.type,
      date: transaction.date,
    });

    setApiError("");
    setIsModalOpen(true);
    setMenuOpen(null);
  };

  // Handle form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate expense against MongoDB budgets
  const validateBudget = async (amount, category, date) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error("Session expired. Please login again.");
      }

      // Fetch budgets from correct backend endpoint
      const response = await fetch(BUDGET_API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch budgets."
        );
      }

      const savedBudgets = data.budgets || [];
      const transactionMonth = date.slice(0, 7);

      // Find budget for the same category and month
      const matchingBudget = savedBudgets.find(
        (item) =>
          normalizeCategory(item.category) ===
            normalizeCategory(category) &&
          item.month === transactionMonth
      );

      if (!matchingBudget) {
        alert(
          `No budget is set for "${category}" for ${transactionMonth}.\n\nPlease create a budget for this category and month first. This transaction has NOT been saved.`
        );

        return false;
      }

      // Calculate already spent amount
      // Exclude current transaction while editing
      const alreadySpent = transactions
        .filter((item) => {
          const isSameCategory =
            normalizeCategory(item.category) ===
            normalizeCategory(category);

          const isSameMonth =
            item.date.slice(0, 7) === transactionMonth;

          const isExpense = item.type === "Expense";

          const isNotEditedTransaction = item.id !== editingId;

          return (
            isExpense &&
            isSameCategory &&
            isSameMonth &&
            isNotEditedTransaction
          );
        })
        .reduce(
          (total, item) => total + Number(item.amount),
          0
        );

      const budgetLimit = Number(matchingBudget.limit);

      // Calculate spending after adding the new expense
      const totalAfterExpense = alreadySpent + amount;

      if (totalAfterExpense > budgetLimit) {
        const exceededAmount = totalAfterExpense - budgetLimit;

        alert(
          `⚠️ BUDGET LIMIT EXCEEDED!\n\n` +
          `Category: ${matchingBudget.category}\n` +
          `Monthly Budget: ${formatAmount(budgetLimit)}\n` +
          `Already Spent: ${formatAmount(alreadySpent)}\n` +
          `New Expense: ${formatAmount(amount)}\n` +
          `Total Spending: ${formatAmount(totalAfterExpense)}\n\n` +
          `You are exceeding your budget by ${formatAmount(exceededAmount)}.\n\n` +
          `This transaction has NOT been saved.`
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error("Budget validation error:", error);

      alert(
        error.message || "Unable to validate your budget."
      );

      return false;
    }
  };

  // Add or update transaction
  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = Number(formData.amount);
    const category = formData.category.trim();
    const title = formData.title.trim();

    if (
      !title ||
      !category ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !formData.date
    ) {
      alert("Please enter valid transaction details.");
      return;
    }

    if (!getToken()) {
      setApiError("Your session has expired. Please login again.");
      return;
    }

    // Validate only expenses
    if (formData.type === "Expense") {
      const isBudgetValid = await validateBudget(
        amount,
        category,
        formData.date
      );

      if (!isBudgetValid) return;
    }

    const transactionData = {
      title,
      category,
      amount,
      type: formData.type,
      date: formData.date,
    };

    try {
      setSaving(true);
      setApiError("");

      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing
          ? `${API_URL}/${editingId}`
          : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(transactionData),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save transaction."
        );
      }

      // Refresh transactions from MongoDB
      await fetchTransactions();

      closeModal();
    } catch (error) {
      console.error("Save transaction error:", error);
      setApiError(error.message || "Unable to save transaction.");
    } finally {
      setSaving(false);
    }
  };

  // Delete transaction
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) return;

    try {
      setApiError("");

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete transaction."
        );
      }

      setTransactions((prev) =>
        prev.filter((item) => item.id !== id)
      );

      setMenuOpen(null);
    } catch (error) {
      console.error("Delete transaction error:", error);
      setApiError(error.message || "Unable to delete transaction.");
    }
  };

  // Close modal
  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialForm);
    setApiError("");
  };

  // Format date
  const formatDate = (date) =>
    new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="transactions-page">

      {/* Page Header */}
      <div className="transactions-header">
        <div>
          <span className="page-eyebrow">
            FINANCIAL ACTIVITY
          </span>

          <h1>Transactions</h1>

          <p>
            Track and manage all your income and expenses.
          </p>
        </div>

        <button
          className="add-transaction-btn"
          onClick={openAddModal}
        >
          <Plus size={19} />
          Add Transaction
        </button>
      </div>

      {/* API Error */}
      {apiError && (
        <div
          role="alert"
          className="transaction-error"
        >
          {apiError}

          <button
            type="button"
            onClick={() => setApiError("")}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="transaction-summary">

        <div className="transaction-summary-card">
          <div className="transaction-summary-icon income-icon">
            <TrendingUp size={21} />
          </div>

          <p>Total Income</p>
          <h2>{formatAmount(totalIncome)}</h2>
        </div>

        <div className="transaction-summary-card">
          <div className="transaction-summary-icon expense-icon">
            <TrendingDown size={21} />
          </div>

          <p>Total Expenses</p>
          <h2>{formatAmount(totalExpense)}</h2>
        </div>

        <div className="transaction-summary-card">
          <div className="transaction-summary-icon balance-icon">
            <Wallet size={21} />
          </div>

          <p>Total Transactions</p>
          <h2>{transactions.length}</h2>
        </div>

      </div>

      {/* Transactions Container */}
      <div className="transactions-container">

        {/* Toolbar */}
        <div className="transactions-toolbar">

          <div>
            <h2>All Transactions</h2>

            <p>
              View your complete transaction history.
            </p>
          </div>

          <div className="transaction-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

        </div>

        {/* Filters */}
        <div className="transaction-filter-row">

          <div className="transaction-filters">
            {["All", "Income", "Expense"].map((filter) => (
              <button
                key={filter}
                className={
                  activeFilter === filter ? "active" : ""
                }
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="category-filter">
            <Filter size={17} />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "All"
                    ? "All Categories"
                    : category}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Desktop Table */}
        <div className="transaction-table-wrapper">

          <table className="transaction-table">

            <thead>
              <tr>
                <th>Transaction</th>
                <th>Category</th>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="empty-transactions">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((item) => (
                  <tr key={item.id}>

                    <td>
                      <div className="transaction-name">

                        <div
                          className={`transaction-type-icon ${item.type.toLowerCase()}`}
                        >
                          {item.type === "Income" ? (
                            <ArrowDownLeft size={19} />
                          ) : (
                            <ArrowUpRight size={19} />
                          )}
                        </div>

                        <span>{item.title}</span>

                      </div>
                    </td>

                    <td>{item.category}</td>

                    <td>{formatDate(item.date)}</td>

                    <td>
                      <span
                        className={`transaction-badge ${item.type.toLowerCase()}`}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td
                      className={`transaction-amount ${item.type.toLowerCase()}`}
                    >
                      {item.type === "Income" ? "+" : "-"}
                      {formatAmount(item.amount)}
                    </td>

                    <td className="transaction-actions-cell">

                      <button
                        className="transaction-more-btn"
                        onClick={() =>
                          setMenuOpen(
                            menuOpen === item.id ? null : item.id
                          )
                        }
                        aria-label="Transaction actions"
                      >
                        <MoreVertical size={19} />
                      </button>

                      {menuOpen === item.id && (
                        <div className="transaction-action-menu">

                          <button
                            onClick={() => openEditModal(item)}
                          >
                            <Pencil size={16} />
                            Edit
                          </button>

                          <button
                            className="delete-action"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>

                        </div>
                      )}

                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-transactions">
                    {apiError
                      ? "Unable to load transactions."
                      : "No transactions found."}
                  </td>
                </tr>
              )}
            </tbody>

          </table>

        </div>

        {/* Mobile Transaction Cards */}
        <div className="transaction-mobile-list">

          {loading ? (
            <div className="empty-transactions">
              Loading transactions...
            </div>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((item) => (
              <div
                className="mobile-transaction-card"
                key={item.id}
              >

                <div className="mobile-transaction-top">

                  <div className="transaction-name">

                    <div
                      className={`transaction-type-icon ${item.type.toLowerCase()}`}
                    >
                      {item.type === "Income" ? (
                        <ArrowDownLeft size={19} />
                      ) : (
                        <ArrowUpRight size={19} />
                      )}
                    </div>

                    <div>
                      <strong>{item.title}</strong>

                      <p>
                        {item.category} · {formatDate(item.date)}
                      </p>
                    </div>

                  </div>

                  <strong
                    className={`transaction-amount ${item.type.toLowerCase()}`}
                  >
                    {item.type === "Income" ? "+" : "-"}
                    {formatAmount(item.amount)}
                  </strong>

                </div>

                <div className="mobile-transaction-actions">

                  <span
                    className={`transaction-badge ${item.type.toLowerCase()}`}
                  >
                    {item.type}
                  </span>

                  <div>
                    <button
                      onClick={() => openEditModal(item)}
                      aria-label="Edit transaction"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      aria-label="Delete transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>

              </div>
            ))
          ) : (
            <div className="empty-transactions">
              {apiError
                ? "Unable to load transactions."
                : "No transactions found."}
            </div>
          )}

        </div>

        {/* Result Count */}
        <div className="transaction-result-count">
          Showing {filteredTransactions.length} of{" "}
          {transactions.length} transactions
        </div>

      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (

        <div
          className="transaction-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="transaction-modal"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="transaction-modal-header">

              <div>
                <span className="page-eyebrow">
                  MANAGE YOUR MONEY
                </span>

                <h2>
                  {editingId !== null
                    ? "Edit Transaction"
                    : "Add Transaction"}
                </h2>

                <p>
                  Enter the details of your transaction.
                </p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeModal}
                aria-label="Close modal"
                disabled={saving}
              >
                <X size={21} />
              </button>

            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>

              {/* Type Selection */}
              <div className="transaction-type-selector">

                <button
                  type="button"
                  className={
                    formData.type === "Income"
                      ? "selected income-option"
                      : ""
                  }
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      type: "Income",
                    }))
                  }
                >
                  <ArrowDownLeft size={19} />
                  Income
                </button>

                <button
                  type="button"
                  className={
                    formData.type === "Expense"
                      ? "selected expense-option"
                      : ""
                  }
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      type: "Expense",
                    }))
                  }
                >
                  <ArrowUpRight size={19} />
                  Expense
                </button>

              </div>

              {/* Transaction Name */}
              <div className="modal-form-group">
                <label htmlFor="transaction-title">
                  Transaction Name
                </label>

                <input
                  id="transaction-title"
                  type="text"
                  name="title"
                  placeholder="e.g. Grocery Shopping"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength={60}
                  required
                />
              </div>

              {/* Amount and Category */}
              <div className="modal-form-row">

                <div className="modal-form-group">
                  <label htmlFor="transaction-amount">
                    Amount (₹)
                  </label>

                  <input
                    id="transaction-amount"
                    type="number"
                    name="amount"
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label htmlFor="transaction-category">
                    Category
                  </label>

                  <input
                    id="transaction-category"
                    type="text"
                    name="category"
                    placeholder="e.g. Food"
                    value={formData.category}
                    onChange={handleInputChange}
                    maxLength={40}
                    required
                  />
                </div>

              </div>

              {/* Date */}
              <div className="modal-form-group">
                <label htmlFor="transaction-date">
                  Transaction Date
                </label>

                <input
                  id="transaction-date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Modal Buttons */}
              <div className="transaction-modal-actions">

                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={saving}
                >
                  {saving ? (
                    "Saving..."
                  ) : editingId !== null ? (
                    <>
                      <Pencil size={17} />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Add Transaction
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Transactions;
