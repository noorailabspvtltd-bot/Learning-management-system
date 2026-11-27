import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRoundPlus,
} from "lucide-react";
import {
  createStudent,
  getStudent,
  updateStudent,
} from "../../api/studentApi";
import type { Student } from "../../types/student";
import Layout from "../../components/Layout";

const empty: Student = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  date_of_birth: null,
  gender: "",
  address: "",
  is_active: true,
};

const inputClassName = "student-form-input";
const labelClassName = "student-form-label";

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Student>(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getStudent(id)
      .then((response) => {
        if (!cancelled) setForm(response.data);
      })
      .catch(() => {
        if (!cancelled) setError("We couldn’t load this student. Please return to the list and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = { ...form, date_of_birth: form.date_of_birth || null };
      if (id) await updateStudent(id, data);
      else await createStudent(data);
      navigate("/students");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data;
        setError(typeof detail === "string" ? detail : JSON.stringify(detail ?? "Please review the information and try again."));
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <Link
          to="/students"
          className="mb-6 inline-flex items-center gap-2 rounded-lg py-1 text-sm font-semibold text-[#716b82] transition hover:text-purple-700"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Back to students
        </Link>

        <div className="mb-7 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-700">
              Student directory
            </p>
            <h1 className="text-[32px] font-bold tracking-[-0.045em] text-[#19172c]">
              {id ? "Edit student" : "Add a student"}
            </h1>
            <p className="mt-2 text-sm text-[#777187]">
              {id
                ? "Update this learner’s contact and profile information."
                : "Add a learner to your academy and keep their details in one place."}
            </p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-[#eee5ff] text-purple-700 shadow-sm sm:flex">
            <UserRoundPlus aria-hidden="true" size={26} strokeWidth={1.8} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="student-form-card">
          <div className="student-form-card-header">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-purple-700 shadow-sm ring-1 ring-[#e9e0f7]">
              <UserRoundPlus aria-hidden="true" size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-[#28243a]">Student information</h2>
              <p className="mt-1 text-xs text-[#827c93]">Fields marked with * are required.</p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#6b50a8] ring-1 ring-[#e9e0f7] sm:inline-flex">
              <Check aria-hidden="true" size={14} />
              Profile details
            </span>
          </div>

          <div className="student-form-content">
            {loading ? (
              <div className="py-12 text-center text-sm font-medium text-[#777187]">Loading student details…</div>
            ) : (
              <>
                {error && (
                  <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                <div className="student-form-grid">
                  <label className={labelClassName} htmlFor="first_name">
                    First name <span className="text-purple-700">*</span>
                    <span className="student-form-control">
                      <input
                        id="first_name"
                        className={inputClassName}
                        name="first_name"
                        autoComplete="given-name"
                        placeholder="e.g. Aditi"
                        value={form.first_name}
                        onChange={handleChange}
                        required
                      />
                    </span>
                  </label>
                  <label className={labelClassName} htmlFor="last_name">
                    Last name <span className="text-purple-700">*</span>
                    <span className="student-form-control">
                      <input
                        id="last_name"
                        className={inputClassName}
                        name="last_name"
                        autoComplete="family-name"
                        placeholder="e.g. Kumar"
                        value={form.last_name}
                        onChange={handleChange}
                        required
                      />
                    </span>
                  </label>

                  <label className={labelClassName} htmlFor="email">
                    Email address <span className="text-purple-700">*</span>
                    <span className="student-form-control">
                      <Mail aria-hidden="true" size={17} className="student-form-field-icon" />
                      <input
                        id="email"
                        className={`${inputClassName} with-icon`}
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="student@example.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </span>
                  </label>
                  <label className={labelClassName} htmlFor="phone">
                    Phone number
                    <span className="student-form-control">
                      <Phone aria-hidden="true" size={17} className="student-form-field-icon" />
                      <input
                        id="phone"
                        className={`${inputClassName} with-icon`}
                        name="phone"
                        autoComplete="tel"
                        placeholder="Add a contact number"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </span>
                  </label>

                  <label className={labelClassName} htmlFor="date_of_birth">
                    Date of birth
                    <span className="student-form-control">
                      <CalendarDays aria-hidden="true" size={17} className="student-form-field-icon" />
                      <input
                        id="date_of_birth"
                        className={`${inputClassName} with-icon`}
                        type="date"
                        name="date_of_birth"
                        value={form.date_of_birth ?? ""}
                        onChange={handleChange}
                      />
                    </span>
                  </label>
                  <label className={labelClassName} htmlFor="gender">
                    Gender
                    <span className="student-form-control">
                      <select
                        id="gender"
                        className={`${inputClassName} with-select-icon`}
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <ChevronDown aria-hidden="true" size={16} className="student-form-select-icon" />
                    </span>
                  </label>

                  <label className={`${labelClassName} student-form-full-width`} htmlFor="address">
                    Address
                    <span className="student-form-control">
                      <MapPin aria-hidden="true" size={17} className="student-form-field-icon address-icon" />
                      <textarea
                        id="address"
                        className={`${inputClassName} with-icon`}
                        name="address"
                        autoComplete="street-address"
                        placeholder="Street, city, and postal code"
                        value={form.address}
                        onChange={handleChange}
                      />
                    </span>
                  </label>

                  <label className={labelClassName} htmlFor="is_active">
                    Student status
                    <span className="student-form-control">
                      <select
                        id="is_active"
                        className={`${inputClassName} with-select-icon`}
                        value={form.is_active ? "active" : "inactive"}
                        onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.value === "active" }))}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <ChevronDown aria-hidden="true" size={16} className="student-form-select-icon" />
                    </span>
                  </label>
                </div>

                <div className="student-form-footer">
                  <p className="text-xs text-[#928ca0]">You can update student details at any time.</p>
                  <div className="student-form-actions">
                    <Link to="/students" className="student-form-button">
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={saving || loading}
                      className="student-form-button primary"
                    >
                      <Save aria-hidden="true" size={17} />
                      {saving ? "Saving…" : id ? "Save changes" : "Add student"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}
