
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const API_URL = "https://devflow-backend-2.onrender.com/api/tasks";

  // =========================
  // TASK DATA
  // =========================

  const [tasks, setTasks] = useState([]);

  // =========================
  // STATISTICS
  // =========================

  const [statistics, setStatistics] = useState({
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    highPriorityTasks: 0,
    mediumPriorityTasks: 0,
    lowPriorityTasks: 0,
  });

  // =========================
  // FORM STATE
  // =========================

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("HIGH");
  const [dueDate, setDueDate] = useState("");

  // =========================
  // SEARCH + FILTER
  // =========================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // =========================
  // SORT
  // =========================

  const [sortBy, setSortBy] = useState("DEFAULT");

  // =========================
  // LOADING + ERROR
  // =========================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // STATUS UPDATE
  // =========================

  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // =========================
  // GET TASKS + STATISTICS
  // =========================

  const fetchTasks = async () => {
    setLoading(true);
    setError("");

    try {
      // Get all tasks
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not fetch tasks");
      }

      const data = await response.json();

      setTasks(data);

      // Get statistics
      const statisticsResponse = await fetch(
        `${API_URL}/statistics`
      );

      if (!statisticsResponse.ok) {
        throw new Error("Could not fetch statistics");
      }

      const statisticsData =
        await statisticsResponse.json();

      setStatistics(statisticsData);

    } catch (error) {
      console.error(error);

      setError(
        "Unable to load tasks. Make sure the Spring Boot server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // =========================
  // CLEAR FORM
  // =========================

  const clearForm = () => {
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setPriority("HIGH");
    setDueDate("");
    setEditingId(null);
  };

  // =========================
  // OPEN CREATE FORM
  // =========================

  const openCreateForm = () => {
    clearForm();
    setShowForm(true);
    setError("");
  };

  // =========================
  // OPEN EDIT FORM
  // =========================

  const openEditForm = (task) => {
    setEditingId(task.id);

    setTitle(task.title || "");
    setDescription(task.description || "");
    setStatus(task.status || "TODO");
    setPriority(task.priority || "HIGH");
    setDueDate(task.dueDate || "");

    setShowForm(true);
    setError("");
  };

  // =========================
  // CLOSE FORM
  // =========================

  const closeForm = () => {
    clearForm();
    setShowForm(false);
    setError("");
  };

  // =========================
  // BACKEND ERROR
  // =========================

  const getErrorMessage = async (response) => {
    try {
      const errorData = await response.json();

      console.log("Backend error:", errorData);

      if (errorData.dueDate) {
        return errorData.dueDate;
      }

      if (errorData.message) {
        return errorData.message;
      }

      const firstError = Object.values(errorData)[0];

      if (typeof firstError === "string") {
        return firstError;
      }

      return "Something went wrong. Please try again.";

    } catch (error) {
      console.error("Could not read backend error:", error);

      return "Something went wrong. Please try again.";
    }
  };

  // =========================
  // CREATE TASK
  // =========================

  const createTask = async (event) => {
    event.preventDefault();

    setError("");

    const task = {
      title: title,
      description: description,
      status: status,
      priority: priority,
      dueDate: dueDate || null,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        const errorMessage =
          await getErrorMessage(response);

        throw new Error(errorMessage);
      }

      closeForm();

      await fetchTasks();

    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // =========================
  // UPDATE TASK
  // =========================

  const updateTask = async (event) => {
    event.preventDefault();

    setError("");

    const task = {
      title: title,
      description: description,
      status: status,
      priority: priority,
      dueDate: dueDate || null,
    };

    try {
      const response = await fetch(
        `${API_URL}/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(task),
        }
      );

      if (!response.ok) {
        const errorMessage =
          await getErrorMessage(response);

        throw new Error(errorMessage);
      }

      closeForm();

      await fetchTasks();

    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // =========================
  // DIRECT STATUS UPDATE
  // =========================

  const updateTaskStatus = async (
    task,
    newStatus
  ) => {
    if (task.status === newStatus) {
      return;
    }

    setError("");

    const oldTask = { ...task };

    // Update UI immediately
    setTasks((previousTasks) =>
      previousTasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              status: newStatus,
            }
          : currentTask
      )
    );

    setUpdatingStatusId(task.id);

    const updatedTask = {
      title: task.title,
      description: task.description,
      status: newStatus,
      priority: task.priority,
      dueDate: task.dueDate || null,
    };

    try {
      const response = await fetch(
        `${API_URL}/${task.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTask),
        }
      );

      if (!response.ok) {
        const errorMessage =
          await getErrorMessage(response);

        throw new Error(errorMessage);
      }

      let serverTask = null;

      try {
        serverTask = await response.json();
      } catch {
        // No response body
      }

      if (serverTask) {
        setTasks((previousTasks) =>
          previousTasks.map((currentTask) =>
            currentTask.id === task.id
              ? serverTask
              : currentTask
          )
        );
      }

      // Refresh statistics
      const statisticsResponse =
        await fetch(`${API_URL}/statistics`);

      if (statisticsResponse.ok) {
        const statisticsData =
          await statisticsResponse.json();

        setStatistics(statisticsData);
      }

    } catch (error) {
      console.error(
        "Status update failed:",
        error
      );

      // Rollback
      setTasks((previousTasks) =>
        previousTasks.map((currentTask) =>
          currentTask.id === task.id
            ? oldTask
            : currentTask
        )
      );

      setError(
        `Could not update status: ${error.message}`
      );

    } finally {
      setUpdatingStatusId(null);
    }
  };

  // =========================
  // DELETE TASK
  // =========================

  const deleteTask = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) {
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorMessage =
          await getErrorMessage(response);

        throw new Error(errorMessage);
      }

      await fetchTasks();

    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // =========================
  // FORMAT DUE DATE
  // =========================

  const formatDueDate = (date) => {
    if (!date) {
      return "No due date";
    }

    const parts = date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const formattedDate = new Date(
      year,
      month - 1,
      day
    );

    return formattedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================
  // DUE DATE STATUS
  // =========================

  const getDueDateStatus = (
    date,
    taskStatus
  ) => {
    if (!date) {
      return {
        text: "No due date",
        className: "no-date",
      };
    }

    if (taskStatus === "COMPLETED") {
      return {
        text: "Completed",
        className: "completed",
      };
    }

    const parts = date.split("-");

    if (parts.length !== 3) {
      return {
        text: "Invalid date",
        className: "overdue",
      };
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const due = new Date(
      year,
      month - 1,
      day
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const difference =
      due.getTime() - today.getTime();

    const daysLeft = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
      return {
        text: "Overdue",
        className: "overdue",
      };
    }

    if (daysLeft === 0) {
      return {
        text: "Due today",
        className: "today",
      };
    }

    if (daysLeft === 1) {
      return {
        text: "Due tomorrow",
        className: "tomorrow",
      };
    }

    return {
      text: `Due in ${daysLeft} days`,
      className: "upcoming",
    };
  };

  // =========================
  // SEARCH + FILTER + SORT
  // =========================

  const filteredTasks = tasks
    .filter((task) => {
      const searchText =
        search.toLowerCase();

      const taskTitle =
        task.title?.toLowerCase() || "";

      const taskDescription =
        task.description?.toLowerCase() || "";

      const matchesSearch =
        taskTitle.includes(searchText) ||
        taskDescription.includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        task.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    })
    .sort((a, b) => {

      if (sortBy === "DEFAULT") {
        return 0;
      }

      if (sortBy === "EARLIEST") {
        if (!a.dueDate && !b.dueDate) {
          return 0;
        }

        if (!a.dueDate) {
          return 1;
        }

        if (!b.dueDate) {
          return -1;
        }

        return a.dueDate.localeCompare(
          b.dueDate
        );
      }

      if (sortBy === "LATEST") {
        if (!a.dueDate && !b.dueDate) {
          return 0;
        }

        if (!a.dueDate) {
          return 1;
        }

        if (!b.dueDate) {
          return -1;
        }

        return b.dueDate.localeCompare(
          a.dueDate
        );
      }

      if (sortBy === "HIGH_TO_LOW") {
        const priorityOrder = {
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };

        return (
          (priorityOrder[b.priority] || 0) -
          (priorityOrder[a.priority] || 0)
        );
      }

      if (sortBy === "LOW_TO_HIGH") {
        const priorityOrder = {
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };

        return (
          (priorityOrder[a.priority] || 0) -
          (priorityOrder[b.priority] || 0)
        );
      }

      if (sortBy === "TITLE_AZ") {
        return (
          a.title || ""
        ).localeCompare(
          b.title || ""
        );
      }

      if (sortBy === "TITLE_ZA") {
        return (
          b.title || ""
        ).localeCompare(
          a.title || ""
        );
      }

      return 0;
    });

  // =========================
  // PROGRESS
  // =========================

  const progressPercentage =
    statistics.totalTasks === 0
      ? 0
      : Math.round(
          (statistics.completedTasks /
            statistics.totalTasks) *
            100
        );
        // =========================
// PRODUCTIVITY INSIGHTS
// =========================

const overdueTasks = tasks.filter((task) => {
  if (!task.dueDate || task.status === "COMPLETED") {
    return false;
  }

  const due = new Date(task.dueDate);
  const today = new Date();

  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return due < today;
}).length;

const upcomingTasks = tasks.filter((task) => {
  if (!task.dueDate || task.status === "COMPLETED") {
    return false;
  }

  const due = new Date(task.dueDate);
  const today = new Date();

  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const days =
    (due.getTime() - today.getTime()) /
    (1000 * 60 * 60 * 24);

  return days >= 0 && days <= 7;
}).length;

const completionRate =
  statistics.totalTasks === 0
    ? 0
    : Math.round(
        (statistics.completedTasks /
          statistics.totalTasks) *
          100
      );

const workload =
  statistics.highPriorityTasks >= 5
    ? "High"
    : statistics.highPriorityTasks >= 3
    ? "Medium"
    : "Low";

let productivityMessage = "";

if (completionRate >= 80) {
  productivityMessage =
    "Excellent progress! You are maintaining a strong completion rate.";
} else if (completionRate >= 50) {
  productivityMessage =
    "Good progress. Focus on completing your remaining high-priority tasks.";
} else {
  productivityMessage =
    "You have several pending tasks. Start with the highest-priority work.";
}

if (overdueTasks > 0) {
  productivityMessage +=
    ` You currently have ${overdueTasks} overdue task${
      overdueTasks > 1 ? "s" : ""
    }.`;
}

  // =========================
  // UI
  // =========================

  return (
    <div className="app">

      {/* HEADER */}

      <header className="dashboard-header">

        <div>
          <h1>DevFlow</h1>

          <p>
            Task Management Dashboard
          </p>
        </div>

        <div className="top-buttons">

          <button
            type="button"
            className="refresh-button"
            onClick={fetchTasks}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "↻ Refresh"}
          </button>

          <button
            type="button"
            className="create-button"
            onClick={openCreateForm}
            disabled={loading}
          >
            + Create Task
          </button>

        </div>

      </header>

      {/* ERROR */}

      {error && (
        <div className="error-message">

          <span>
            ❌ {error}
          </span>

          <button
            type="button"
            onClick={fetchTasks}
          >
            Try Again
          </button>

        </div>
      )}

      {/* LOADING */}

      {loading ? (

        <div className="loading-message">

          <div className="loader"></div>

          <h2>
            Loading tasks...
          </h2>

          <p>
            Please wait while we connect
            to the server.
          </p>

        </div>

      ) : (

        <>

          {/* STATISTICS */}

          <section className="stats">

            <div className="stat-card">

              <div className="stat-icon">
                📋
              </div>

              <div>
                <p>Total Tasks</p>

                <h2>
                  {statistics.totalTasks}
                </h2>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                ⏳
              </div>

              <div>
                <p>In Progress</p>

                <h2>
                  {statistics.inProgressTasks}
                </h2>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                ✓
              </div>

              <div>
                <p>Completed</p>

                <h2>
                  {statistics.completedTasks}
                </h2>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                !
              </div>

              <div>
                <p>High Priority</p>

                <h2>
                  {statistics.highPriorityTasks}
                </h2>
              </div>

            </div>

          </section>

          {/* ANALYTICS SUMMARY */}

          <section className="progress-section">

            <div className="progress-header">

              <div>
                <h2>
                  Overall Progress
                </h2>

                <p>
                  Track how much of your work is completed
                </p>
              </div>

              <div className="progress-percentage">
                {progressPercentage}%
              </div>

            </div>

            <div className="progress-bar-container">

              <div
                className="progress-bar"
                style={{
                  width: `${progressPercentage}%`,
                }}
              ></div>

            </div>

            <div className="progress-footer">

              <span>
                {statistics.completedTasks} of{" "}
                {statistics.totalTasks} tasks completed
              </span>

              <span>
                {statistics.totalTasks -
                  statistics.completedTasks}{" "}
                tasks remaining
              </span>

            </div>

          </section>
          {/* =========================
    PRODUCTIVITY INSIGHTS
========================= */}

<section className="insights-section">

  <div className="section-title">
    <div>
      <h2>Productivity Insights</h2>
      <p>Understand your current development workflow</p>
    </div>

    <span className="insight-badge">
      AI Insights
    </span>
  </div>

  <div className="insights-grid">

    <div className="insight-card">
      <div className="insight-icon">📈</div>

      <div>
        <span>Completion Rate</span>
        <strong>{completionRate}%</strong>
        <small>
          {statistics.completedTasks} completed
        </small>
      </div>
    </div>

    <div className="insight-card">
      <div className="insight-icon">🔥</div>

      <div>
        <span>Workload</span>
        <strong>{workload}</strong>
        <small>
          {statistics.highPriorityTasks} high priority
        </small>
      </div>
    </div>

    <div className="insight-card">
      <div className="insight-icon">⏰</div>

      <div>
        <span>Upcoming</span>
        <strong>{upcomingTasks}</strong>
        <small>Due within 7 days</small>
      </div>
    </div>

    <div className="insight-card">
      <div className="insight-icon">⚠️</div>

      <div>
        <span>Overdue</span>
        <strong>{overdueTasks}</strong>
        <small>Requires attention</small>
      </div>
    </div>

  </div>

  <div className="smart-insight">

    <div className="smart-insight-icon">
      💡
    </div>

    <div>
      <h3>Intelligent Recommendation</h3>

      <p>
        {productivityMessage}
      </p>
    </div>

  </div>

</section>

          {/* CREATE / EDIT FORM */}

          {showForm && (

            <div className="form-container">

              <form
                className="task-form"
                onSubmit={
                  editingId === null
                    ? createTask
                    : updateTask
                }
              >

                <div className="form-header">

                  <div>

                    <h2>
                      {editingId === null
                        ? "Create New Task"
                        : "Edit Task"}
                    </h2>

                    <p>
                      {editingId === null
                        ? "Add a new task to your workflow."
                        : "Update the details of this task."}
                    </p>

                  </div>

                  <button
                    type="button"
                    className="close-button"
                    onClick={closeForm}
                  >
                    ×
                  </button>

                </div>

                <div className="form-group">

                  <label>
                    Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target.value
                      )
                    }
                    placeholder="Enter task title"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    placeholder="Enter task description"
                    rows="4"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Due Date
                  </label>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(
                        event.target.value
                      )
                    }
                  />

                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label>
                      Status
                    </label>

                    <select
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target.value
                        )
                      }
                    >

                      <option value="TODO">
                        TODO
                      </option>

                      <option value="IN_PROGRESS">
                        IN_PROGRESS
                      </option>

                      <option value="COMPLETED">
                        COMPLETED
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Priority
                    </label>

                    <select
                      value={priority}
                      onChange={(event) =>
                        setPriority(
                          event.target.value
                        )
                      }
                    >

                      <option value="HIGH">
                        HIGH
                      </option>

                      <option value="MEDIUM">
                        MEDIUM
                      </option>

                      <option value="LOW">
                        LOW
                      </option>

                    </select>

                  </div>

                </div>

                <div className="form-buttons">

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-button"
                  >
                    {editingId === null
                      ? "Create Task"
                      : "Update Task"}
                  </button>

                </div>

              </form>

            </div>

          )}

          {/* TASK SECTION */}

          <section className="tasks-section">

            <div className="section-title">

              <div>

                <h2>
                  Tasks
                </h2>

                <p>
                  Manage and track your work
                </p>

              </div>

              <span className="task-count">
                {filteredTasks.length} tasks
              </span>

            </div>

            {/* FILTERS */}

            <div className="filters">

              <div className="search-wrapper">

                <span>
                  🔍
                </span>

                <input
                  type="text"
                  className="search-input"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />

              </div>

              <select
                className="filter-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >

                <option value="ALL">
                  All Status
                </option>

                <option value="TODO">
                  TODO
                </option>

                <option value="IN_PROGRESS">
                  IN_PROGRESS
                </option>

                <option value="COMPLETED">
                  COMPLETED
                </option>

              </select>

              <select
                className="filter-select"
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(
                    event.target.value
                  )
                }
              >

                <option value="ALL">
                  All Priority
                </option>

                <option value="HIGH">
                  HIGH
                </option>

                <option value="MEDIUM">
                  MEDIUM
                </option>

                <option value="LOW">
                  LOW
                </option>

              </select>

              <select
                className="filter-select"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value
                  )
                }
              >

                <option value="DEFAULT">
                  Sort: Default
                </option>

                <option value="EARLIEST">
                  Earliest Due Date
                </option>

                <option value="LATEST">
                  Latest Due Date
                </option>

                <option value="HIGH_TO_LOW">
                  Priority: High → Low
                </option>

                <option value="LOW_TO_HIGH">
                  Priority: Low → High
                </option>

                <option value="TITLE_AZ">
                  Title: A → Z
                </option>

                <option value="TITLE_ZA">
                  Title: Z → A
                </option>

              </select>

            </div>

            {/* TASK LIST */}

            <div className="task-list">

              {filteredTasks.length === 0 ? (

                <div className="empty-state">

                  <div className="empty-icon">
                    📋
                  </div>

                  <h2>
                    No tasks found
                  </h2>

                  <p>
                    Try changing your search
                    or filters.
                  </p>

                  <button
                    type="button"
                    onClick={openCreateForm}
                  >
                    + Create Your First Task
                  </button>

                </div>

              ) : (

                filteredTasks.map((task) => {

                  const dueStatus =
                    getDueDateStatus(
                      task.dueDate,
                      task.status
                    );

                  const isUpdating =
                    updatingStatusId === task.id;

                  return (

                    <div
                      className="task-card"
                      key={task.id}
                    >

                      <div className="task-card-top">

                        <div className="task-title-area">

                          <h3>
                            {task.title}
                          </h3>

                          <p>
                            {task.description}
                          </p>

                        </div>

                        <span className="id-badge">
                          #{task.id}
                        </span>

                      </div>

                      <div className="due-date">

                        <span>
                          📅
                        </span>

                        <strong>
                          Due:{" "}
                          {formatDueDate(
                            task.dueDate
                          )}
                        </strong>

                        <span
                          className={`due-status ${dueStatus.className}`}
                        >
                          {dueStatus.text}
                        </span>

                      </div>

                      <div className="status-section">

                        <div className="status-label">
                          Change Status
                        </div>

                        <div
                          className={`status-control ${
                            isUpdating
                              ? "status-loading"
                              : ""
                          }`}
                        >

                          <button
                            type="button"
                            className={`status-option todo ${
                              task.status === "TODO"
                                ? "active"
                                : ""
                            }`}
                            disabled={isUpdating}
                            onClick={() =>
                              updateTaskStatus(
                                task,
                                "TODO"
                              )
                            }
                          >

                            <span className="status-dot"></span>

                            TODO

                          </button>

                          <div className="status-arrow">
                            →
                          </div>

                          <button
                            type="button"
                            className={`status-option in-progress ${
                              task.status ===
                              "IN_PROGRESS"
                                ? "active"
                                : ""
                            }`}
                            disabled={isUpdating}
                            onClick={() =>
                              updateTaskStatus(
                                task,
                                "IN_PROGRESS"
                              )
                            }
                          >

                            <span className="status-dot"></span>

                            In Progress

                          </button>

                          <div className="status-arrow">
                            →
                          </div>

                          <button
                            type="button"
                            className={`status-option completed ${
                              task.status ===
                              "COMPLETED"
                                ? "active"
                                : ""
                            }`}
                            disabled={isUpdating}
                            onClick={() =>
                              updateTaskStatus(
                                task,
                                "COMPLETED"
                              )
                            }
                          >

                            <span className="status-dot"></span>

                            Completed

                          </button>

                        </div>

                        {isUpdating && (

                          <span className="status-saving">
                            Saving...
                          </span>

                        )}

                      </div>

                      <div className="task-bottom">

                        <div className="task-info">

                          <span
                            className={`priority-badge ${
                              task.priority?.toLowerCase()
                            }`}
                          >
                            {task.priority}
                          </span>

                        </div>

                        <div className="task-actions">

                          <button
                            type="button"
                            className="edit-button"
                            onClick={() =>
                              openEditForm(task)
                            }
                          >
                            ✎ Edit
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              deleteTask(task.id)
                            }
                          >
                            🗑 Delete
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                })
              )}

            </div>

          </section>

        </>

      )}

    </div>
  );
}

export default App;
