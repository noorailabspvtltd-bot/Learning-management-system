import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Course = {
  id: number;
  title: string;
  description?: string;
  is_published?: boolean;
  created_at?: string;
  instructor?: string;
};

const API_URL = "/api/courses/";

function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("Courses");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);

  async function loadCourses() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load courses.");
      }

      const data = await response.json();
      setCourses(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      setError("Unable to connect to the courses API. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) =>
      `${course.title} ${course.description ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [courses, search]);

  const publishedCount = courses.filter(
    (course) => course.is_published
  ).length;

  const draftCount = courses.length - publishedCount;

  function resetForm() {
    setTitle("");
    setDescription("");
    setPublished(false);
    setEditingCourse(null);
    setShowForm(false);
  }

  async function addCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          is_published: published,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Course could not be created.");
      }

      const newCourse = await response.json();

      setCourses((current) => [newCourse, ...current]);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(course: Course) {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description ?? "");
    setPublished(Boolean(course.is_published));
    setShowForm(true);
    setError("");
  }

  async function updateCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingCourse || !title.trim()) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}${editingCourse.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          is_published: published,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Course could not be updated.");
      }

      const updatedCourse = await response.json();

      setCourses((current) =>
        current.map((course) =>
          course.id === editingCourse.id ? updatedCourse : course
        )
      );

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Update failed."
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(course: Course) {
    setError("");

    try {
      const response = await fetch(`${API_URL}${course.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_published: !course.is_published,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not update course.");
      }

      const updatedCourse = await response.json();

      setCourses((current) =>
        current.map((item) =>
          item.id === course.id ? updatedCourse : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Update failed."
      );
    }
  }

  async function deleteCourse(id: number) {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete course.");
      }

      setCourses((current) =>
        current.filter((course) => course.id !== id)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Delete failed."
      );
    }
  }

  const navigation = [
    ["▦", "Dashboard"],
    ["▣", "My Batches"],
    ["▷", "Live Classes"],
    ["♙", "Students"],
    ["▤", "Courses"],
    ["☷", "Assignments"],
    ["▥", "Assessments"],
    ["☑", "Attendance"],
    ["◷", "Reports"],
    ["▱", "Resources"],
    ["♧", "Announcements"],
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">N</div>
          <div>
            <h2>Noor AI Labs</h2>
            <span>LMS - Trainer</span>
          </div>
        </div>

        <nav className="side-nav">
          {navigation.map(([icon, label]) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? "active" : ""
              }`}
              onClick={() => setActivePage(label)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">?</div>
            <div>
              <strong>Need help?</strong>
              <span>We're here for you.</span>
            </div>
          </div>

          <div className="sidebar-footer">
            Noor AI Labs · Learning made better
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="global-search">
            <span>⌕</span>
            <input
              placeholder="Search students, batches, assignments..."
              aria-label="Search the LMS"
            />
          </div>

          <div className="topbar-right">
            <button className="notification" aria-label="Notifications">
              ♧<i />
            </button>

            <div className="profile-avatar">T</div>

            <div className="profile-name">
              <strong>Trainer</strong>
              <span>⌄</span>
            </div>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                WORKSPACE / {activePage.toUpperCase()}
              </div>
              <h1>{activePage}</h1>
              <p>
                Manage your learning content and keep everything organised.
              </p>
            </div>

            <div className="heading-mark">✦</div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">▤</div>
              <div>
                <span>Total Courses</span>
                <strong>{courses.length}</strong>
              </div>
              <small>All courses</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">✓</div>
              <div>
                <span>Published Courses</span>
                <strong>{publishedCount}</strong>
              </div>
              <small>Available to learners</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">◷</div>
              <div>
                <span>Draft Courses</span>
                <strong>{draftCount}</strong>
              </div>
              <small>Still in progress</small>
            </div>
          </div>

          <div className="section-heading">
            <div>
              <h2>Course Management</h2>
              <p>Create, organise and manage your courses.</p>
            </div>

            <button
              className="primary-button"
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setEditingCourse(null);
                  setTitle("");
                  setDescription("");
                  setPublished(false);
                  setShowForm(true);
                }
              }}
            >
              <span>＋</span>
              {showForm ? "Close Form" : "Add Course"}
            </button>
          </div>

          {showForm && (
            <form
              className="course-form"
              onSubmit={editingCourse ? updateCourse : addCourse}
            >
              <div className="form-heading">
                <div className="form-icon">
                  {editingCourse ? "✎" : "＋"}
                </div>

                <div>
                  <h3>
                    {editingCourse ? "Edit course" : "Create a new course"}
                  </h3>
                  <p>
                    {editingCourse
                      ? "Update your course details."
                      : "Fill in the details to add a course to your workspace."}
                  </p>
                </div>
              </div>

              <label htmlFor="course-title">Course title</label>
              <input
                id="course-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Introduction to Artificial Intelligence"
                required
              />

              <label htmlFor="course-description">
                Course description
              </label>
              <textarea
                id="course-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="What will students learn in this course?"
                rows={3}
              />

              <label className="publish-option">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(event) =>
                    setPublished(event.target.checked)
                  }
                />
                Publish this course immediately
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCourse
                      ? "Save Changes"
                      : "Create Course"}
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="error-message">
              <span>!</span> {error}
              <button onClick={loadCourses}>Try again</button>
            </div>
          )}

          <div className="toolbar">
            <div className="filter-label">
              <span>▤</span> All Courses <span className="chevron">⌄</span>
            </div>

            <div className="table-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by course name..."
              />
            </div>

            <button className="outline-button" onClick={loadCourses}>
              ↻ Refresh
            </button>
          </div>

          <div className="table-panel">
            <div className="course-table table-header">
              <span>#</span>
              <span>Course Name</span>
              <span>Description</span>
              <span>Created</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="loading-spinner" />
                <strong>Loading courses...</strong>
                <span>Getting your course workspace ready.</span>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▤</div>

                <strong>
                  {search
                    ? "No matching courses found"
                    : "No courses yet"}
                </strong>

                <span>
                  {search
                    ? "Try another search term."
                    : "Create your first course to get started."}
                </span>

                {!search && (
                  <button
                    className="primary-button"
                    onClick={() => setShowForm(true)}
                  >
                    ＋ Create your first course
                  </button>
                )}
              </div>
            ) : (
              filteredCourses.map((course, index) => (
                <div className="course-table table-row" key={course.id}>
                  <span className="row-number">{index + 1}</span>

                  <div className="course-name-cell">
                    <div className="course-avatar">
                      {course.title.slice(0, 2).toUpperCase()}
                    </div>
                    <strong>{course.title}</strong>
                  </div>

                  <span className="description-cell">
                    {course.description || "No description added"}
                  </span>

                  <span className="date-cell">
                    {course.created_at
                      ? new Date(course.created_at).toLocaleDateString()
                      : "—"}
                  </span>

                  <span>
                    <span
                      className={`status-pill ${
                        course.is_published
                          ? "status-active"
                          : "status-draft"
                      }`}
                    >
                      {course.is_published ? "Published" : "Draft"}
                    </span>
                  </span>

                  <div className="action-buttons">
                    <button
                      className="edit-action"
                      title="Edit course"
                      onClick={() => startEdit(course)}
                    >
                      ✎
                    </button>

                    <button
                      className="edit-action"
                      title={
                        course.is_published
                          ? "Unpublish course"
                          : "Publish course"
                      }
                      onClick={() => togglePublish(course)}
                    >
                      {course.is_published ? "◷" : "✓"}
                    </button>

                    <button
                      className="delete-action"
                      title="Delete course"
                      onClick={() => deleteCourse(course.id)}
                    >
                      ♧
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="table-footer">
            Showing {filteredCourses.length} of {courses.length} courses
            <span>Page 1</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;