import { useEffect, useMemo, useState } from "react";
import API_URL from "../services/api";
import {
  Plus,
  Target,
  Wallet,
  TrendingUp,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  PiggyBank,
  CircleDollarSign,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import "../styles/SavingsGoals.css";

const API_URL = `${import.meta.env.VITE_API_URL}/api/savings-goals`;

const blank = {
  name: "",
  category: "Personal",
  targetAmount: "",
  savedAmount: "0",
  targetDate: "",
};

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const getToken = () =>
  localStorage.getItem("spendwiseAuthToken") ||
  sessionStorage.getItem("spendwiseAuthToken");

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(blank);
  const [amounts, setAmounts] = useState({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // FETCH ALL SAVINGS GOALS
  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("Your session has expired. Please login again.");
        return;
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load savings goals.");
      }

      setGoals(
        (data.goals || []).map((goal) => ({
          ...goal,
          id: goal._id,
        }))
      );
    } catch (err) {
      setError(err.message || "Unable to load savings goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // SUMMARY CALCULATIONS
  const totals = useMemo(() => {
    const target = goals.reduce(
      (sum, goal) => sum + Number(goal.targetAmount || 0),
      0
    );

    const saved = goals.reduce(
      (sum, goal) => sum + Number(goal.savedAmount || 0),
      0
    );

    const completed = goals.filter(
      (goal) => Number(goal.savedAmount) >= Number(goal.targetAmount)
    ).length;

    return {
      target,
      saved,
      remaining: Math.max(target - saved, 0),
      completed,
      progress: target ? Math.min((saved / target) * 100, 100) : 0,
    };
  }, [goals]);

  // OPEN ADD MODAL
  const openAdd = () => {
    setEditingId(null);
    setForm(blank);
    setNotice("");
    setModal(true);
  };

  // OPEN EDIT MODAL
  const openEdit = (goal) => {
    setEditingId(goal.id);

    setForm({
      name: goal.name,
      category: goal.category,
      targetAmount: String(goal.targetAmount),
      savedAmount: String(goal.savedAmount),
      targetDate: goal.targetDate || "",
    });

    setNotice("");
    setModal(true);
  };

  const close = () => {
    setModal(false);
    setEditingId(null);
    setForm(blank);
  };

  const change = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  // CREATE OR UPDATE GOAL
  const submit = async (e) => {
    e.preventDefault();

    const targetAmount = Number(form.targetAmount);
    const savedAmount = Number(form.savedAmount);

    if (!form.name.trim()) {
      return setNotice("Please enter a goal name.");
    }

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return setNotice("Target amount must be greater than zero.");
    }

    if (
      !Number.isFinite(savedAmount) ||
      savedAmount < 0 ||
      savedAmount > targetAmount
    ) {
      return setNotice(
        "Saved amount must be between zero and the target amount."
      );
    }

    const goalData = {
      name: form.name.trim(),
      category: form.category,
      targetAmount,
      savedAmount,
      targetDate: form.targetDate,
    };

    try {
      setSaving(true);
      setNotice("");

      const token = getToken();

      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(goalData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save goal.");
      }

      await fetchGoals();

      setNotice(
        editingId
          ? "Savings goal updated successfully."
          : "Savings goal created successfully."
      );

      close();
    } catch (err) {
      setNotice(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // DELETE GOAL
  const remove = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this savings goal?"
    );

    if (!confirmed) return;

    try {
      setNotice("");

      const token = getToken();

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete goal.");
      }

      setGoals((current) => current.filter((goal) => goal.id !== id));

      setAmounts((current) => {
        const updated = { ...current };
        delete updated[id];
        return updated;
      });

      setNotice("Savings goal deleted successfully.");
    } catch (err) {
      setNotice(err.message || "Unable to delete goal.");
    }
  };

  // ADD MONEY TO GOAL
  const addMoney = async (goal) => {
    const amount = Number(amounts[goal.id]);

    const remaining = Math.max(
      Number(goal.targetAmount) - Number(goal.savedAmount),
      0
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      return setNotice("Enter an amount greater than zero.");
    }

    if (remaining <= 0) {
      return setNotice("This goal is already completed.");
    }

    if (amount > remaining) {
      return setNotice(`You can add up to ${money(remaining)} to this goal.`);
    }

    try {
      setNotice("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/${goal.id}/add-money`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add money.");
      }

      setGoals((current) =>
        current.map((item) =>
          item.id === goal.id
            ? { ...data.goal, id: data.goal._id }
            : item
        )
      );

      setAmounts((current) => ({
        ...current,
        [goal.id]: "",
      }));

      setNotice(`${money(amount)} added to ${goal.name}.`);
    } catch (err) {
      setNotice(err.message || "Unable to add money.");
    }
  };

  // CALCULATE DAYS LEFT
  const daysLeft = (date) => {
    if (!date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(`${date}T00:00:00`);

    return Number.isNaN(target.getTime())
      ? null
      : Math.ceil((target - today) / 86400000);
  };

  return (
    <div className="savings-goals-page">
      {/* HEADER */}
      <header className="savings-page-header">
        <div>
          <span className="savings-eyebrow">PLAN YOUR FUTURE</span>
          <h1>Savings Goals</h1>
          <p>
            Set meaningful goals, save consistently, and celebrate every
            milestone.
          </p>
        </div>

        <button className="savings-primary-btn" onClick={openAdd}>
          <Plus size={18} />
          Create New Goal
        </button>
      </header>

      {/* NOTICE */}
      {notice && (
        <div className="savings-notice" role="status">
          <AlertCircle size={17} />
          <span>{notice}</span>

          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="savings-notice" role="alert">
          <AlertCircle size={17} />
          <span>{error}</span>

          <button onClick={fetchGoals} aria-label="Retry loading goals">
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <section className="savings-summary-grid">
        <article className="savings-summary-card">
          <div className="savings-summary-icon">
            <Target />
          </div>
          <span>Active Goals</span>
          <strong>{goals.length}</strong>
          <small>{totals.completed} completed</small>
        </article>

        <article className="savings-summary-card">
          <div className="savings-summary-icon">
            <Wallet />
          </div>
          <span>Total Saved</span>
          <strong>{money(totals.saved)}</strong>
          <small>Across all your goals</small>
        </article>

        <article className="savings-summary-card">
          <div className="savings-summary-icon">
            <PiggyBank />
          </div>
          <span>Total Target</span>
          <strong>{money(totals.target)}</strong>
          <small>Combined goal amount</small>
        </article>

        <article className="savings-summary-card">
          <div className="savings-summary-icon">
            <TrendingUp />
          </div>
          <span>Amount to Go</span>
          <strong>{money(totals.remaining)}</strong>
          <small>{totals.progress.toFixed(1)}% of target saved</small>
        </article>
      </section>

      {/* OVERALL PROGRESS */}
      <section className="savings-overview-card">
        <div className="savings-overview-top">
          <div>
            <span className="savings-overview-label">
              YOUR SAVINGS JOURNEY
            </span>
            <h2>Every rupee takes you closer.</h2>
          </div>

          <strong>{totals.progress.toFixed(1)}%</strong>
        </div>

        <div className="savings-progress-track">
          <div
            className="savings-progress-fill"
            style={{ width: `${totals.progress}%` }}
          />
        </div>

        <div className="savings-overview-bottom">
          <span>{money(totals.saved)} saved</span>
          <span>{money(totals.target)} total target</span>
        </div>
      </section>

      {/* GOALS HEADING */}
      <div className="savings-section-heading">
        <div>
          <h2>Your Goals</h2>
          <p>Track each milestone and add money as you save.</p>
        </div>

        <span>
          {goals.length} {goals.length === 1 ? "goal" : "goals"}
        </span>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="savings-empty-state">
          <p>Loading your savings goals...</p>
        </div>
      ) : goals.length === 0 ? (
        /* EMPTY STATE */
        <div className="savings-empty-state">
          <div className="savings-empty-icon">
            <Target size={30} />
          </div>

          <h3>No savings goals yet</h3>
          <p>Create your first goal and start building a saving habit.</p>

          <button className="savings-primary-btn" onClick={openAdd}>
            <Plus size={17} />
            Create Your First Goal
          </button>
        </div>
      ) : (
        /* GOALS GRID */
        <section className="savings-goals-grid">
          {goals.map((goal) => {
            const target = Number(goal.targetAmount) || 0;
            const saved = Number(goal.savedAmount) || 0;

            const remaining = Math.max(target - saved, 0);

            const progress = target
              ? Math.min((saved / target) * 100, 100)
              : 0;

            const complete = remaining === 0;
            const days = daysLeft(goal.targetDate);

            return (
              <article className="savings-goal-card" key={goal.id}>
                <div className="savings-goal-card-top">
                  <div className="savings-goal-symbol">
                    <CircleDollarSign size={22} />
                  </div>

                  <div className="savings-goal-actions">
                    <button
                      onClick={() => openEdit(goal)}
                      aria-label={`Edit ${goal.name}`}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() => remove(goal.id)}
                      aria-label={`Delete ${goal.name}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <div className="savings-goal-title-row">
                  <div>
                    <span className="savings-goal-category">
                      {goal.category}
                    </span>
                    <h3>{goal.name}</h3>
                  </div>

                  {complete && (
                    <span className="savings-completed-badge">
                      <CheckCircle2 size={14} />
                      Completed
                    </span>
                  )}
                </div>

                <div className="savings-goal-amounts">
                  <strong>{money(saved)}</strong>
                  <span>of {money(target)}</span>
                </div>

                <div className="savings-goal-progress-track">
                  <div
                    className="savings-goal-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="savings-goal-progress-meta">
                  <span>{progress.toFixed(0)}% completed</span>
                  <span>{money(remaining)} left</span>
                </div>

                <div className="savings-goal-date">
                  <CalendarDays size={15} />

                  {!goal.targetDate
                    ? "No target date"
                    : days < 0
                      ? "Target date passed"
                      : days === 0
                        ? "Due today"
                        : `${days} days left`}
                </div>

                {!complete && (
                  <div className="savings-add-money">
                    <input
                      type="number"
                      min="1"
                      max={remaining}
                      placeholder="Amount (₹)"
                      value={amounts[goal.id] || ""}
                      onChange={(e) =>
                        setAmounts((previous) => ({
                          ...previous,
                          [goal.id]: e.target.value,
                        }))
                      }
                      aria-label={`Amount to add to ${goal.name}`}
                    />

                    <button onClick={() => addMoney(goal)}>
                      Add Money
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* CREATE / EDIT MODAL */}
      {modal && (
        <div
          className="savings-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              close();
            }
          }}
        >
          <div
            className="savings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="savings-modal-title"
          >
            <div className="savings-modal-header">
              <div>
                <span className="savings-eyebrow">
                  {editingId ? "UPDATE YOUR PLAN" : "START SAVING"}
                </span>

                <h2 id="savings-modal-title">
                  {editingId ? "Edit Savings Goal" : "Create Savings Goal"}
                </h2>
              </div>

              <button
                className="savings-modal-close"
                onClick={close}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submit}>
              <label>
                Goal Name
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  placeholder="e.g. Buy a new laptop"
                  maxLength={50}
                  required
                />
              </label>

              <label>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={change}
                >
                  <option>Personal</option>
                  <option>Emergency</option>
                  <option>Travel</option>
                  <option>Technology</option>
                  <option>Education</option>
                  <option>Home</option>
                  <option>Vehicle</option>
                  <option>Other</option>
                </select>
              </label>

              <div className="savings-form-row">
                <label>
                  Target Amount (₹)
                  <input
                    name="targetAmount"
                    type="number"
                    min="1"
                    value={form.targetAmount}
                    onChange={change}
                    placeholder="50000"
                    required
                  />
                </label>

                <label>
                  Already Saved (₹)
                  <input
                    name="savedAmount"
                    type="number"
                    min="0"
                    value={form.savedAmount}
                    onChange={change}
                    placeholder="0"
                  />
                </label>
              </div>

              <label>
                Target Date
                <input
                  name="targetDate"
                  type="date"
                  value={form.targetDate}
                  onChange={change}
                />
              </label>

              {notice && (
                <div className="savings-notice" role="alert">
                  <AlertCircle size={17} />
                  <span>{notice}</span>
                </div>
              )}

              <div className="savings-modal-actions">
                <button
                  type="button"
                  className="savings-cancel-btn"
                  onClick={close}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="savings-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}