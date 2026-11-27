import { ChevronDown, Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { getStudents, deleteStudent } from "../../api/studentApi";
import type { Student } from "../../types/student";

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getStudents(page, search)
      .then((res) => {
        if (cancelled) return;
        setStudents(res.data.results);
        setHasNext(res.data.next !== null);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load students");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, refresh]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this student?")) return;
    await deleteStudent(id);
    setRefresh((current) => current + 1);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError("");
    try {
      const allStudents: Student[] = [];
      let exportPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await getStudents(exportPage, search);
        allStudents.push(...response.data.results);
        hasMore = response.data.next !== null;
        exportPage += 1;
      }

      const columns: Array<[string, (student: Student) => string | number | boolean | null]> = [
        ["ID", (student) => student.id ?? ""],
        ["First name", (student) => student.first_name],
        ["Last name", (student) => student.last_name],
        ["Email", (student) => student.email],
        ["Phone", (student) => student.phone],
        ["Date of birth", (student) => student.date_of_birth],
        ["Gender", (student) => student.gender],
        ["Address", (student) => student.address],
        ["Status", (student) => student.is_active ? "Active" : "Inactive"],
      ];
      const escapeCell = (value: string | number | boolean | null) =>
        `"${String(value ?? "").replaceAll('"', '""')}"`;
      const csv = [
        columns.map(([label]) => escapeCell(label)).join(","),
        ...allStudents.map((student) => columns.map(([, getValue]) => escapeCell(getValue(student))).join(",")),
      ].join("\r\n");
      const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError("Could not export students. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <h1 className="mb-7 text-[34px] font-bold tracking-[-0.045em] text-[#19172c]">
        Students
      </h1>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <label className="relative">
          <span className="sr-only">Filter by batch</span>
          <select className="h-11 min-w-36 appearance-none rounded-xl border border-[#e6e0f5] bg-white px-4 pr-10 text-sm font-semibold text-[#35304a] shadow-[0_2px_8px_rgba(73,54,117,0.05)] outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100">
            <option>All Batches</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            size={17}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6c6680]"
          />
        </label>

        <div className="relative min-w-[240px] flex-1 max-w-[440px]">
          <Search
            aria-hidden="true"
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77708d]"
          />
          <input
            className="h-11 w-full rounded-xl border border-[#e6e0f5] bg-white pl-11 pr-4 text-sm text-[#302b42] shadow-[0_2px_8px_rgba(73,54,117,0.05)] outline-none transition placeholder:text-[#89839a] focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setSearch(event.target.value);
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#e5def8] bg-white px-4 text-sm font-semibold text-purple-700 shadow-[0_2px_8px_rgba(73,54,117,0.05)] transition hover:bg-purple-50 disabled:cursor-wait disabled:opacity-60"
          >
            <Download aria-hidden="true" size={17} strokeWidth={2.2} />
            {exporting ? "Exporting…" : "Export"}
          </button>
          <Link
            to="/students/new"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(126,34,206,0.18)] transition hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-200"
          >
            <Plus aria-hidden="true" size={18} strokeWidth={2.5} />
            Add Student
          </Link>
        </div>
      </div>

      {exportError && <p role="alert" className="mb-3 text-sm font-medium text-red-600">{exportError}</p>}

      <div className="overflow-x-auto rounded-2xl bg-[#f1edfb] p-2.5 sm:p-3">
        {loading && <p className="p-6 text-sm text-[#6c6680]">Loading students…</p>}
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}
        {!loading && !error && students.length === 0 && (
          <p className="p-6 text-sm text-[#6c6680]">No students found.</p>
        )}

        {!error && students.length > 0 && (
          <table className="w-full min-w-[920px] border-separate border-spacing-y-2 text-left">
            <thead className="text-[13px] font-semibold text-[#51496b]">
              <tr>
                <th className="rounded-l-xl bg-[#e9e3f8] px-4 py-3.5">#</th>
                <th className="bg-[#e9e3f8] px-4 py-3.5">Student Name</th>
                <th className="bg-[#e9e3f8] px-4 py-3.5">Batch</th>
                <th className="bg-[#e9e3f8] px-4 py-3.5">Email</th>
                <th className="bg-[#e9e3f8] px-4 py-3.5">Attendance</th>
                <th className="bg-[#e9e3f8] px-4 py-3.5">Status</th>
                <th className="rounded-r-xl bg-[#e9e3f8] px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  className="bg-white text-[13px] text-[#4c485e] shadow-[0_2px_9px_rgba(65,47,105,0.07)] transition hover:bg-[#fefeff]"
                >
                  <td className="rounded-l-xl px-4 py-3.5 font-medium text-[#625d72]">
                    {(page - 1) * 10 + index + 1}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0e8ff] text-[13px] font-bold text-purple-700">
                        {initials(student.first_name, student.last_name)}
                      </div>
                      <Link
                        to={`/students/${student.id}`}
                        className="font-semibold text-[#211e31] transition hover:text-purple-700"
                      >
                        {student.first_name} {student.last_name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-[#716b82]">-</td>
                  <td className="px-4 py-3.5">{student.email}</td>
                  <td className="px-4 py-3.5 font-medium text-[#716b82]">-</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        student.is_active
                          ? "bg-[#dcf8e8] text-[#16834b]"
                          : "bg-[#f1f0f5] text-[#777184]"
                      }`}
                    >
                      {student.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="rounded-r-xl px-3 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        aria-label={`Edit ${student.first_name} ${student.last_name}`}
                        title="Edit student"
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#6d55b7] transition hover:bg-purple-50 hover:text-purple-800"
                        to={`/students/${student.id}/edit`}
                      >
                        <Pencil aria-hidden="true" size={16} />
                      </Link>
                      <button
                        aria-label={`Delete ${student.first_name} ${student.last_name}`}
                        title="Delete student"
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#dc6673] transition hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(student.id!)}
                      >
                        <Trash2 aria-hidden="true" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3 text-sm text-[#5f5a70]">
        <button
          disabled={page === 1}
          onClick={() => {
            setLoading(true);
            setPage(page - 1);
          }}
          className="rounded-lg border border-[#e5def2] bg-white px-3.5 py-2 font-medium shadow-sm transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        <span className="font-medium">Page {page}</span>
        <button
          disabled={!hasNext}
          onClick={() => {
            setLoading(true);
            setPage(page + 1);
          }}
          className="rounded-lg border border-[#e5def2] bg-white px-3.5 py-2 font-medium shadow-sm transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </Layout>
  );
}
