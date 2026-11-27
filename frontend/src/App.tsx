import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Course = {
  id: number;
  title: string;
  description?: string;
  is_published?: boolean;
  created_at?: string;
  published_at?: string;
  duration?: string;
  instructor?: string;
};

type Lesson = {
  id: number;
  title: string;
  description: string;
  content: string;
};

type Role = "Trainer" | "Student";

const API_URL = "/api/courses/";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("Courses");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [role, setRole] = useState<Role>("Trainer");
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);

  // Lessons and progress
  const [lessons, setLessons] = useState<Record<number, Lesson[]>>(
    () => readStorage("lms_lessons", {})
  );
  const [progress, setProgress] = useState<Record<number, Record<number, boolean>>>(
    () => readStorage("lms_progress", {})
  );

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonContent, setLessonContent] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    localStorage.setItem("lms_lessons", JSON.stringify(lessons));
  }, [lessons]);

  useEffect(() => {
    localStorage.setItem("lms_progress", JSON.stringify(progress));
  }, [progress]);

  async function loadCourses() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Could not load courses.");

      const data = await response.json();
      setCourses(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      setError("Unable to connect to the courses API. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const publishedCourses = courses.filter((course) => course.is_published);

  const filteredCourses = useMemo(() => {
    const availableCourses = role === "Student" ? publishedCourses : courses;

    return availableCourses.filter((course) =>
      `${course.title} ${course.description ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [courses, search, role]);

  const publishedCount = publishedCourses.length;
  const draftCount = courses.length - publishedCount;

  function switchRole(nextRole: Role) {
    setRole(nextRole);
    setShowRoleMenu(false);
    setActivePage("Courses");
    setSearch("");
    setShowForm(false);
    setEditingCourse(null);
    setSelectedCourse(null);
    setError("");
  }

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

      if (!response.ok) throw new Error(await response.text());

      const newCourse = await response.json();
      setCourses((current) => [newCourse, ...current]);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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

      if (!response.ok) throw new Error(await response.text());

      const updatedCourse = await response.json();
      setCourses((current) =>
        current.map((course) =>
          course.id === editingCourse.id ? updatedCourse : course
        )
      );
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
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

      if (!response.ok) throw new Error("Could not update course.");

      const updatedCourse = await response.json();
      setCourses((current) =>
        current.map((item) =>
          item.id === course.id ? updatedCourse : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function deleteCourse(id: number) {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Could not delete course.");

      setCourses((current) => current.filter((course) => course.id !== id));
      setLessons((current) => {
        const updated = { ...current };
        delete updated[id];
        return updated;
      });
      setProgress((current) => {
        const updated = { ...current };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  // Add a lesson to the selected course
  function addLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCourse || !lessonTitle.trim()) return;

    const newLesson: Lesson = {
      id: Date.now(),
      title: lessonTitle.trim(),
      description: lessonDescription.trim(),
      content: lessonContent.trim(),
    };

    setLessons((current) => ({
      ...current,
      [selectedCourse.id]: [
        ...(current[selectedCourse.id] ?? []),
        newLesson,
      ],
    }));

    setLessonTitle("");
    setLessonDescription("");
    setLessonContent("");
  }

  function deleteLesson(lessonId: number) {
    if (!selectedCourse) return;
    if (!window.confirm("Delete this lesson?")) return;

    setLessons((current) => ({
      ...current,
      [selectedCourse.id]: (current[selectedCourse.id] ?? []).filter(
        (lesson) => lesson.id !== lessonId
      ),
    }));

    setProgress((current) => {
      const updated = { ...current };
      if (updated[selectedCourse.id]) {
        updated[selectedCourse.id] = { ...updated[selectedCourse.id] };
        delete updated[selectedCourse.id][lessonId];
      }
      return updated;
    });
  }

  function toggleLessonComplete(lessonId: number) {
    if (!selectedCourse) return;

    setProgress((current) => ({
      ...current,
      [selectedCourse.id]: {
        ...(current[selectedCourse.id] ?? {}),
        [lessonId]: !(current[selectedCourse.id]?.[lessonId] ?? false),
      },
    }));
  }

  function getCourseProgress(courseId: number) {
    const courseLessons = lessons[courseId] ?? [];
    if (courseLessons.length === 0) return 0;

    const completed = courseLessons.filter(
      (lesson) => progress[courseId]?.[lesson.id]
    ).length;

    return Math.round((completed / courseLessons.length) * 100);
  }

  function openCourse(course: Course) {
    setSelectedCourse(course);
    setActivePage("Courses");
  }

  const trainerNavigation = [
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

  const navigation =
    role === "Trainer" ? trainerNavigation : [["▤", "Courses"]];

  const totalLessons = Object.values(lessons).reduce(
    (total, courseLessons) => total + courseLessons.length,
    0
  );

  const completedLessons = Object.entries(lessons).reduce(
    (total, [courseId, courseLessons]) =>
      total +
      courseLessons.filter(
        (lesson) => progress[Number(courseId)]?.[lesson.id]
      ).length,
    0
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">N</div>
          <div>
            <h2>Noor AI Labs</h2>
            <span>LMS - {role}</span>
          </div>
        </div>

        <nav className="side-nav">
          {navigation.map(([icon, label]) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => {
                setActivePage(label);
                setSelectedCourse(null);
              }}
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
              placeholder="Search courses..."
              aria-label="Search the LMS"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="topbar-right">
            <button className="notification" aria-label="Notifications">
              ♧<i />
            </button>

            <div className="profile-avatar">
              {role === "Trainer" ? "T" : "S"}
            </div>

            <div style={{ position: "relative" }}>
              <button
                className="profile-name"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                type="button"
              >
                <strong>{role}</strong>
                <span>⌄</span>
              </button>

              {showRoleMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "42px",
                    right: 0,
                    background: "#ffffff",
                    padding: "8px",
                    borderRadius: "12px",
                    boxShadow: "0 8px 25px rgba(40,20,60,0.15)",
                    minWidth: "145px",
                    zIndex: 100,
                  }}
                >
                  {(["Trainer", "Student"] as Role[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => switchRole(item)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px",
                        border: "none",
                        borderRadius: "8px",
                        background: role === item ? "#F0EAFB" : "#ffffff",
                        color: "#282332",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      {item === "Trainer" ? "♙ " : "♧ "}
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                WORKSPACE / {role.toUpperCase()} / {activePage.toUpperCase()}
              </div>
              <h1>
                {selectedCourse
                  ? selectedCourse.title
                  : activePage === "Reports"
                    ? "Learning Reports"
                    : role === "Trainer"
                      ? activePage
                      : "Available Courses"}
              </h1>
              <p>
                {selectedCourse
                  ? "Explore lessons and learning materials."
                  : activePage === "Reports"
                    ? "Monitor lesson completion and student learning progress."
                    : role === "Trainer"
                      ? "Manage your learning content and keep everything organised."
                      : "Explore published courses and discover something new to learn."}
              </p>
            </div>
            <div className="heading-mark">✦</div>
          </div>

          {/* TRAINER REPORTS */}
          {role === "Trainer" && activePage === "Reports" && !selectedCourse && (
            <div style={{ marginTop: "28px" }}>
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
                    <span>Total Lessons</span>
                    <strong>{totalLessons}</strong>
                  </div>
                  <small>Across all courses</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">◷</div>
                  <div>
                    <span>Completed Lessons</span>
                    <strong>{completedLessons}</strong>
                  </div>
                  <small>Recorded in this browser</small>
                </div>
              </div>

              <div className="table-panel" style={{ marginTop: "25px", padding: "20px" }}>
                <h2 style={{ color: "#282332" }}>Course Progress Overview</h2>
                {courses.length === 0 ? (
                  <p>No courses available yet.</p>
                ) : (
                  courses.map((course) => {
                    const courseLessons = lessons[course.id] ?? [];
                    const percentage = getCourseProgress(course.id);

                    return (
                      <div
                        key={course.id}
                        style={{
                          padding: "18px 0",
                          borderBottom: "1px solid #EEE8F5",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <strong>{course.title}</strong>
                          <span style={{ color: "#7200A8", fontWeight: 600 }}>
                            {percentage}%
                          </span>
                        </div>
                        <p style={{ color: "#81798D", fontSize: "13px" }}>
                          {courseLessons.filter(
                            (lesson) => progress[course.id]?.[lesson.id]
                          ).length} of {courseLessons.length} lessons completed
                        </p>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
                <p style={{ color: "#81798D", fontSize: "12px", marginTop: "16px" }}>
                  Demo report: progress is stored locally in this browser. Real
                  student-by-student reports require backend authentication and
                  progress APIs.
                </p>
              </div>
            </div>
          )}

          {/* TRAINER COURSE MANAGEMENT */}
          {role === "Trainer" && activePage !== "Reports" && !selectedCourse && (
            <>
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
                      <h3>{editingCourse ? "Edit course" : "Create a new course"}</h3>
                      <p>Enter the details for your course.</p>
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

                  <label htmlFor="course-description">Course description</label>
                  <textarea
                    id="course-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What will students learn in this course?"
                    rows={3}
                  />

                  <label className="publish-option">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(event) => setPublished(event.target.checked)}
                    />
                    Publish this course immediately
                  </label>

                  <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={resetForm}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-button" disabled={saving}>
                      {saving
                        ? "Saving..."
                        : editingCourse
                          ? "Save Changes"
                          : "Create Course"}
                    </button>
                  </div>
                </form>
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
                    <strong>Loading courses...</strong>
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="empty-state">
                    <strong>{search ? "No matching courses found" : "No courses yet"}</strong>
                    <span>
                      {search ? "Try another search term." : "Create your first course to get started."}
                    </span>
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
                        <span className={`status-pill ${course.is_published ? "status-active" : "status-draft"}`}>
                          {course.is_published ? "Published" : "Draft"}
                        </span>
                      </span>

                      <div className="action-buttons">
                        <button className="edit-action" title="Edit course" onClick={() => startEdit(course)}>
                          ✎
                        </button>
                        <button
                          className="edit-action"
                          title="Manage lessons"
                          onClick={() => openCourse(course)}
                        >
                          ▷
                        </button>
                        <button
                          className="edit-action"
                          title={course.is_published ? "Unpublish course" : "Publish course"}
                          onClick={() => togglePublish(course)}
                        >
                          {course.is_published ? "◷" : "✓"}
                        </button>
                        <button className="delete-action" title="Delete course" onClick={() => deleteCourse(course.id)}>
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
            </>
          )}

          {/* STUDENT COURSE CATALOGUE */}
          {role === "Student" && !selectedCourse && (
            <div style={{ marginTop: "28px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "22px",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, color: "#282332" }}>Explore Courses</h2>
                  <p style={{ color: "#81798D", marginTop: "6px" }}>
                    {publishedCount} published courses available
                  </p>
                </div>
                <button className="outline-button" onClick={loadCourses}>
                  ↻ Refresh
                </button>
              </div>

              {loading && <div className="empty-state"><strong>Loading courses...</strong></div>}

              {!loading && filteredCourses.length === 0 && (
                <div className="empty-state">
                  <strong>{search ? "No matching courses found" : "No published courses available"}</strong>
                  <span>
                    {search
                      ? "Try searching with another course name."
                      : "Published courses will appear here when your trainer makes them available."}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "20px",
                }}
              >
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      padding: "22px",
                      border: "1px solid #EEE8F5",
                      boxShadow: "0 5px 18px rgba(50,30,70,0.05)",
                    }}
                  >
                    <div
                      style={{
                        width: "46px",
                        height: "46px",
                        borderRadius: "12px",
                        background: "#F0EAFB",
                        color: "#7200A8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        marginBottom: "18px",
                      }}
                    >
                      {course.title.slice(0, 2).toUpperCase()}
                    </div>

                    <span className="status-pill status-active" style={{ display: "inline-block", marginBottom: "12px" }}>
                      Published
                    </span>

                    <h3 style={{ color: "#282332", margin: "0 0 10px" }}>{course.title}</h3>

                    <p style={{ color: "#81798D", fontSize: "14px", lineHeight: 1.6, minHeight: "44px" }}>
                      {course.description || "Explore this learning course."}
                    </p>

                    <div className="learning-progress">
                      <div className="progress-label">
                        <span>Learning progress</span>
                        <strong>{getCourseProgress(course.id)}%</strong>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${getCourseProgress(course.id)}%` }} />
                      </div>
                    </div>

                    <p style={{ color: "#81798D", fontSize: "13px" }}>
                      {lessons[course.id]?.length ?? 0} lessons
                    </p>

                    <button className="view-course-btn" onClick={() => openCourse(course)}>
                      View Course →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SELECTED COURSE: TRAINER AND STUDENT LESSON VIEW */}
          {selectedCourse && (
            <div style={{ marginTop: "28px" }}>
              <div
                style={{
                  background: "#ffffff",
                  padding: "28px",
                  borderRadius: "18px",
                  border: "1px solid #EEE8F5",
                  boxShadow: "0 5px 18px rgba(50,30,70,0.05)",
                }}
              >
                <button
                  className="outline-button"
                  onClick={() => setSelectedCourse(null)}
                >
                  ← Back to Courses
                </button>

                <div style={{ marginTop: "25px" }}>
                  <span className={`status-pill ${selectedCourse.is_published ? "status-active" : "status-draft"}`}>
                    {selectedCourse.is_published ? "Published" : "Draft"}
                  </span>

                  <h2 style={{ color: "#282332", marginTop: "16px" }}>
                    {selectedCourse.title}
                  </h2>

                  <p style={{ color: "#81798D", lineHeight: 1.7 }}>
                    {selectedCourse.description || "Explore this learning course."}
                  </p>

                  {role === "Trainer" && (
                    <form
                      onSubmit={addLesson}
                      style={{
                        marginTop: "25px",
                        padding: "22px",
                        background: "#F8F5FC",
                        borderRadius: "14px",
                        display: "grid",
                        gap: "12px",
                      }}
                    >
                      <h3 style={{ color: "#282332", margin: 0 }}>＋ Add a Lesson</h3>

                      <input
                        value={lessonTitle}
                        onChange={(event) => setLessonTitle(event.target.value)}
                        placeholder="Lesson title"
                        required
                      />

                      <input
                        value={lessonDescription}
                        onChange={(event) => setLessonDescription(event.target.value)}
                        placeholder="Short lesson description"
                      />

                      <textarea
                        value={lessonContent}
                        onChange={(event) => setLessonContent(event.target.value)}
                        placeholder="Enter lesson notes or learning content..."
                        rows={5}
                      />

                      <button type="submit" className="primary-button">
                        Add Lesson
                      </button>
                    </form>
                  )}

                  {role === "Student" && (
                    <div style={{ marginTop: "24px" }}>
                      <div className="learning-progress">
                        <div className="progress-label">
                          <span>Your course progress</span>
                          <strong>{getCourseProgress(selectedCourse.id)}%</strong>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${getCourseProgress(selectedCourse.id)}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: "28px" }}>
                    <h3 style={{ color: "#282332" }}>Course Lessons</h3>

                    {(lessons[selectedCourse.id] ?? []).length === 0 ? (
                      <div className="empty-state">
                        <strong>No lessons added yet</strong>
                        <span>
                          {role === "Trainer"
                            ? "Use the form above to add the first lesson."
                            : "Your trainer has not added lessons to this course yet."}
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: "14px" }}>
                        {(lessons[selectedCourse.id] ?? []).map((lesson, index) => {
                          const isComplete = Boolean(progress[selectedCourse.id]?.[lesson.id]);

                          return (
                            <div
                              key={lesson.id}
                              style={{
                                padding: "20px",
                                background: "#F8F5FC",
                                borderRadius: "14px",
                                border: "1px solid #EEE8F5",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                <div>
                                  <span style={{ color: "#7200A8", fontSize: "12px", fontWeight: 700 }}>
                                    LESSON {index + 1}
                                  </span>
                                  <h4 style={{ margin: "7px 0", color: "#282332" }}>
                                    {lesson.title}
                                  </h4>
                                  <p style={{ color: "#81798D", margin: 0, fontSize: "14px" }}>
                                    {lesson.description || "Course learning material"}
                                  </p>
                                </div>

                                {role === "Student" ? (
                                  <button
                                    className={isComplete ? "secondary-button" : "primary-button"}
                                    onClick={() => toggleLessonComplete(lesson.id)}
                                  >
                                    {isComplete ? "✓ Completed" : "Mark Complete"}
                                  </button>
                                ) : (
                                  <button
                                    className="delete-action"
                                    title="Delete lesson"
                                    onClick={() => deleteLesson(lesson.id)}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>

                              {lesson.content && (
                                <div
                                  style={{
                                    marginTop: "16px",
                                    padding: "16px",
                                    background: "#ffffff",
                                    borderRadius: "10px",
                                    color: "#51485D",
                                    lineHeight: 1.7,
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {lesson.content}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span>!</span> {error}
              <button onClick={loadCourses}>Try again</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;