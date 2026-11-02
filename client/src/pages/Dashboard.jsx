
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";


import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  RefreshCw,
} from "lucide-react";

import "../styles/dashboard.css";
const API_URL = "https://spendwise-expense-31h4.onrender.com/api";

const getToken = () =>
  localStorage.getItem("spendwiseAuthToken") ||
  sessionStorage.getItem("spendwiseAuthToken");

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "";

  const dateOnly = String(date).slice(0, 10);
  const [year, month, day] = dateOnly.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getMonthKey = (date) => {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(
    value.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getLastSixMonths = () => {
  const today = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - 5 + index,
      1
    );

    return {
      key: getMonthKey(date),
      label: date.toLocaleDateString("en-IN", {
        month: "short",
      }),
    };
  });
};

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = localStorage.getItem("spendwiseCurrentUser");

  let currentUser = {};

  try {
    currentUser = storedUser ? JSON.parse(storedUser) : {};
  } catch {
    currentUser = {};
  }

  const userName = currentUser.name || "there";

  // Fetch logged-in user's transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please login again to view your dashboard.");
      }

      const response = await fetch(`${API_URL}/transactions`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load dashboard data."
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
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Financial summary
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((item) => item.type === "Income")
        .reduce((total, item) => total + item.amount, 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((item) => item.type === "Expense")
        .reduce((total, item) => total + item.amount, 0),
    [transactions]
  );

  const totalBalance = totalIncome - totalExpenses;

  // Savings shown as net savings (income minus expenses)
  const totalSavings = totalBalance;

  // Last six months income and expenses
  const monthlyData = useMemo(() => {
    const months = getLastSixMonths();

    return months.map((month) => {
      const monthTransactions = transactions.filter(
        (item) => item.date.slice(0, 7) === month.key
      );

      const income = monthTransactions
        .filter((item) => item.type === "Income")
        .reduce((total, item) => total + item.amount, 0);

      const expenses = monthTransactions
        .filter((item) => item.type === "Expense")
        .reduce((total, item) => total + item.amount, 0);

      return {
        ...month,
        income,
        expenses,
      };
    });
  }, [transactions]);

  const monthlyMax = Math.max(
    1,
    ...monthlyData.flatMap((item) => [item.income, item.expenses])
  );

  // Current month's category-wise expenses
  const categoryData = useMemo(() => {
    const currentMonth = getMonthKey(new Date());

    const totals = {};

    transactions
      .filter(
        (item) =>
          item.type === "Expense" &&
          item.date.slice(0, 7) === currentMonth
      )
      .forEach((item) => {
        totals[item.category] =
          (totals[item.category] || 0) + item.amount;
      });

    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  const categoryMax = Math.max(
    1,
    ...categoryData.map((item) => item.amount)
  );

  // Latest five transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="dashboard-page">

      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div>
          <p className="welcome-tag">YOUR FINANCIAL OVERVIEW</p>

          <h1>Welcome back, {userName}!</h1>

          <p className="welcome-description">
            Here's what's happening with your money today.
          </p>
        </div>

        <Link to="/transactions" className="add-transaction-btn">
          <Plus size={19} />
          Add Transaction
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="dashboard-error" role="alert">
          <span>{error}</span>

          <button onClick={fetchTransactions}>
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      {/* Financial Summary */}
      <section className="financial-summary">
        <div className="section-heading">
          <h2>Financial Overview</h2>
          <p>Track your money at a glance</p>
        </div>

        <div className="summary-grid">

          <div className="summary-card">
            <div className="summary-card-top">
              <span>Total Balance</span>
              <Wallet size={21} />
            </div>

            <h2>
              {loading ? "Loading..." : formatAmount(totalBalance)}
            </h2>

            <p>Your income minus expenses</p>
          </div>

          <div className="summary-card">
            <div className="summary-card-top">
              <span>Total Income</span>
              <TrendingUp size={21} />
            </div>

            <h2>
              {loading ? "Loading..." : formatAmount(totalIncome)}
            </h2>

            <p>Money received</p>
          </div>

          <div className="summary-card">
            <div className="summary-card-top">
              <span>Total Expenses</span>
              <TrendingDown size={21} />
            </div>

            <h2>
              {loading ? "Loading..." : formatAmount(totalExpenses)}
            </h2>

            <p>Money spent</p>
          </div>

          <div className="summary-card">
            <div className="summary-card-top">
              <span>Net Savings</span>
              <PiggyBank size={21} />
            </div>

            <h2>
              {loading ? "Loading..." : formatAmount(totalSavings)}
            </h2>

            <p>Income remaining after expenses</p>
          </div>

        </div>
      </section>

      {/* Financial Analytics */}
      <section className="dashboard-charts">
        <div className="section-heading">
          <h2>Financial Analytics</h2>
          <p>Understand your income and spending patterns</p>
        </div>

        <div className="dashboard-analytics-grid">

          {/* Monthly Income vs Expenses */}
          <div className="dashboard-chart-card">
            <div className="chart-card-heading">
              <div>
                <h3>Income vs Expenses</h3>
                <p>Last 6 months</p>
              </div>
            </div>

            {loading ? (
              <div className="chart-empty">
                Loading chart...
              </div>
            ) : transactions.length === 0 ? (
              <div className="chart-empty">
                Add transactions to view your financial analytics.
              </div>
            ) : (
              <>
                <div className="monthly-chart">
                  {monthlyData.map((month) => (
                    <div className="monthly-chart-column" key={month.key}>
                      <div className="monthly-bars">
                        <div
                          className="monthly-bar income-bar"
                          style={{
                            height: `${Math.max(
                              month.income > 0 ? 3 : 0,
                              (month.income / monthlyMax) * 100
                            )}%`,
                          }}
                          title={`Income: ${formatAmount(month.income)}`}
                        />

                        <div
                          className="monthly-bar expense-bar"
                          style={{
                            height: `${Math.max(
                              month.expenses > 0 ? 3 : 0,
                              (month.expenses / monthlyMax) * 100
                            )}%`,
                          }}
                          title={`Expenses: ${formatAmount(month.expenses)}`}
                        />
                      </div>

                      <span>{month.label}</span>
                    </div>
                  ))}
                </div>

                <div className="chart-legend">
                  <span>
                    <i className="legend-dot income-dot" />
                    Income
                  </span>

                  <span>
                    <i className="legend-dot expense-dot" />
                    Expenses
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Category Spending */}
          <div className="dashboard-chart-card">
            <div className="chart-card-heading">
              <div>
                <h3>Spending by Category</h3>
                <p>This month</p>
              </div>
            </div>

            {loading ? (
              <div className="chart-empty">
                Loading chart...
              </div>
            ) : categoryData.length === 0 ? (
              <div className="chart-empty">
                No expenses recorded this month.
              </div>
            ) : (
              <div className="category-chart">
                {categoryData.map((item) => (
                  <div
                    className="category-chart-item"
                    key={item.category}
                  >
                    <div className="category-chart-info">
                      <span>{item.category}</span>
                      <strong>{formatAmount(item.amount)}</strong>
                    </div>

                    <div className="category-progress-track">
                      <div
                        className="category-progress-fill"
                        style={{
                          width: `${(item.amount / categoryMax) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Recent Transactions */}
      <section className="recent-transactions">
        <div className="section-heading recent-heading">
          <div>
            <h2>Recent Transactions</h2>
            <p>Your latest income and expenses</p>
          </div>

          <Link to="/transactions" className="view-all-link">
            View All
          </Link>
        </div>

        <div className="recent-transactions-card">

          {loading ? (
            <div className="transactions-placeholder">
              Loading transactions...
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="transactions-placeholder">
              <Receipt size={25} />
              <p>No transactions yet.</p>
              <Link to="/transactions">
                Add your first transaction
              </Link>
            </div>
          ) : (
            <div className="recent-transaction-list">
              {recentTransactions.map((item) => (
                <div
                  className="recent-transaction-item"
                  key={item.id}
                >
                  <div className="recent-transaction-left">

                    <div
                      className={`recent-transaction-icon ${item.type.toLowerCase()}`}
                    >
                      {item.type === "Income" ? (
                        <ArrowDownLeft size={19} />
                      ) : (
                        <ArrowUpRight size={19} />
                      )}
                    </div>

                    <div className="recent-transaction-details">
                      <strong>{item.title}</strong>

                      <span>
                        {item.category} · {formatDate(item.date)}
                      </span>
                    </div>

                  </div>

                  <strong
                    className={`recent-transaction-amount ${item.type.toLowerCase()}`}
                  >
                    {item.type === "Income" ? "+" : "-"}
                    {formatAmount(item.amount)}
                  </strong>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

    </div>
  );
}

export default Dashboard;
