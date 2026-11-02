import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import "../styles/analytics.css";

const API_URL = "http://localhost:5000/api/transactions";

const COLORS = [
  "#10A37F",
  "#F59E0B",
  "#6366F1",
  "#EF6B6B",
  "#0EA5E9",
  "#A855F7",
  "#64748B",
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const getToken = () =>
  localStorage.getItem("spendwiseAuthToken") ||
  sessionStorage.getItem("spendwiseAuthToken");

const getMonthKey = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
};

const getCategory = (category) => {
  const value = String(category || "Other").trim();
  return value || "Other";
};

function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState("6");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH TRANSACTIONS FROM MONGODB
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Your session has expired. Please login again.");
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch transaction data."
        );
      }

      // Supports common API response formats.
      const records = Array.isArray(data)
        ? data
        : data.transactions || data.data || [];

      if (!Array.isArray(records)) {
        throw new Error("Invalid transaction data received from server.");
      }

      setTransactions(records);
    } catch (err) {
      setError(err.message || "Something went wrong while loading analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ANALYTICS CALCULATIONS
  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonth = getMonthKey(now);

    const validTransactions = transactions.filter(
      (item) =>
        Number.isFinite(Number(item.amount)) &&
        Number(item.amount) > 0
    );

    const incomeTransactions = validTransactions.filter(
      (item) => item.type?.toLowerCase() === "income"
    );

    const expenseTransactions = validTransactions.filter(
      (item) => item.type?.toLowerCase() === "expense"
    );

    // TOTAL INCOME
    const totalIncome = incomeTransactions.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    // TOTAL EXPENSE
    const totalExpense = expenseTransactions.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    // CURRENT MONTH INCOME
    const currentIncome = incomeTransactions
      .filter((item) => getMonthKey(item.date) === currentMonth)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    // CURRENT MONTH EXPENSE
    const currentExpense = expenseTransactions
      .filter((item) => getMonthKey(item.date) === currentMonth)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    // MONTHLY INCOME AND EXPENSE CHART
    const monthlyData = Array.from(
      { length: Number(period) },
      (_, index) => {
        const date = new Date(
          now.getFullYear(),
          now.getMonth() - (Number(period) - 1 - index),
          1
        );

        const key = getMonthKey(date);

        const income = incomeTransactions
          .filter((item) => getMonthKey(item.date) === key)
          .reduce((sum, item) => sum + Number(item.amount), 0);

        const expense = expenseTransactions
          .filter((item) => getMonthKey(item.date) === key)
          .reduce((sum, item) => sum + Number(item.amount), 0);

        return {
          month: date.toLocaleDateString("en-IN", {
            month: "short",
          }),
          income,
          expense,
          savings: income - expense,
        };
      }
    );

    // CATEGORY-WISE EXPENSE BREAKDOWN
    const categoryMap = {};

    expenseTransactions
      .filter((item) => getMonthKey(item.date) === currentMonth)
      .forEach((item) => {
        const category = getCategory(item.category);

        categoryMap[category] =
          (categoryMap[category] || 0) + Number(item.amount);
      });

    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    // NET SAVINGS AND SAVINGS RATE
    const savings = totalIncome - totalExpense;

    const savingsRate =
      totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      savings,
      savingsRate,
      currentIncome,
      currentExpense,
      monthlyData,
      categoryData,
    };
  }, [transactions, period]);

  const hasTransactions = transactions.length > 0;

  return (
    <div className="analytics-page">
      {/* HEADER */}
      <div className="analytics-header">
        <div>
          <span className="analytics-eyebrow">
            FINANCIAL INSIGHTS
          </span>

          <h1>Analytics</h1>

          <p>
            Understand your spending habits and track your financial growth.
          </p>
        </div>

        <div className="analytics-date">
          <CalendarDays size={17} />

          {new Date().toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="analytics-empty">
          <Wallet size={30} />
          <h3>Loading analytics...</h3>
          <p>Fetching your financial data.</p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="analytics-empty" role="alert">
          <TrendingDown size={30} />
          <h3>Unable to load analytics</h3>
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchTransactions}
            style={{
              padding: "10px 16px",
              border: 0,
              borderRadius: "9px",
              background: "#10A37F",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && !hasTransactions && (
        <div className="analytics-empty">
          <Wallet size={30} />
          <h3>No transaction data yet</h3>
          <p>
            Add some income and expenses to see your financial analytics.
          </p>
        </div>
      )}

      {/* SUMMARY CARDS */}
      {!loading && !error && (
        <>
          <div className="analytics-summary">
            <div className="analytics-card">
              <div className="analytics-card-top">
                <span>Total Income</span>

                <div className="analytics-icon income-icon">
                  <TrendingUp size={20} />
                </div>
              </div>

              <h2>{formatCurrency(analytics.totalIncome)}</h2>

              <p>
                <ArrowUpRight size={15} />
                All recorded income
              </p>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-top">
                <span>Total Expenses</span>

                <div className="analytics-icon expense-icon">
                  <TrendingDown size={20} />
                </div>
              </div>

              <h2>{formatCurrency(analytics.totalExpense)}</h2>

              <p>
                <ArrowDownRight size={15} />
                All recorded expenses
              </p>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-top">
                <span>Net Savings</span>

                <div className="analytics-icon savings-icon">
                  <PiggyBank size={20} />
                </div>
              </div>

              <h2>{formatCurrency(analytics.savings)}</h2>

              <p>{analytics.savingsRate.toFixed(1)}% of total income</p>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-top">
                <span>Current Month Expense</span>

                <div className="analytics-icon balance-icon">
                  <Wallet size={20} />
                </div>
              </div>

              <h2>{formatCurrency(analytics.currentExpense)}</h2>

              <p>
                Income: {formatCurrency(analytics.currentIncome)}
              </p>
            </div>
          </div>

          {/* INCOME VS EXPENSES */}
          <section className="analytics-panel">
            <div className="analytics-panel-header">
              <div>
                <h2>Income vs Expenses</h2>
                <p>Compare your monthly financial activity</p>
              </div>

              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                aria-label="Select chart period"
              >
                <option value="3">Last 3 months</option>
                <option value="6">Last 6 months</option>
                <option value="12">Last 12 months</option>
              </select>
            </div>

            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis dataKey="month" />

                  <YAxis
                    tickFormatter={(value) => `₹${value}`}
                  />

                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                  />

                  <Legend />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#10A37F"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="expense"
                    name="Expenses"
                    fill="#EF6B6B"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* BOTTOM CHARTS */}
          <div className="analytics-bottom-grid">
            {/* EXPENSE BREAKDOWN */}
            <section className="analytics-panel">
              <div className="analytics-panel-header">
                <div>
                  <h2>Expense Breakdown</h2>
                  <p>Current month's category-wise spending</p>
                </div>
              </div>

              {analytics.categoryData.length > 0 ? (
                <>
                  <div className="analytics-pie-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.categoryData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={3}
                        >
                          {analytics.categoryData.map(
                            (entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>

                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="analytics-category-list">
                    {analytics.categoryData.map((item, index) => (
                      <div
                        className="analytics-category-item"
                        key={item.name}
                      >
                        <div className="analytics-category-name">
                          <span
                            className="category-dot"
                            style={{
                              background: COLORS[index % COLORS.length],
                            }}
                          />

                          {item.name}
                        </div>

                        <strong>{formatCurrency(item.value)}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="analytics-chart-empty">
                  No expenses recorded this month.
                </div>
              )}
            </section>

            {/* SAVINGS TREND */}
            <section className="analytics-panel">
              <div className="analytics-panel-header">
                <div>
                  <h2>Savings Trend</h2>
                  <p>Monthly income minus expenses</p>
                </div>
              </div>

              <div className="analytics-chart savings-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis dataKey="month" />

                    <YAxis
                      tickFormatter={(value) => `₹${value}`}
                    />

                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                    />

                    <Area
                      type="monotone"
                      dataKey="savings"
                      name="Savings"
                      stroke="#10A37F"
                      fill="#DDF3E9"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;