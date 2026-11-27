import Layout from "../../components/Layout";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getStudent } from "../../api/studentApi";
import type { Student } from "../../types/student";

export default function StudentDetails() {
  const { id } = useParams();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (id) getStudent(id).then((res) => setStudent(res.data));
  }, [id]);

  if (!student) return <p className="p-6">Loading...</p>;

  return (
    <Layout>
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        {student.first_name} {student.last_name}
      </h1>
      <p><b>Email:</b> {student.email}</p>
      <p><b>Phone:</b> {student.phone}</p>
      <p><b>Date of birth:</b> {student.date_of_birth}</p>
      <p><b>Gender:</b> {student.gender}</p>
      <p><b>Address:</b> {student.address}</p>
      <p><b>Status:</b> {student.is_active ? "Active" : "Inactive"}</p>
      <div className="mt-4 space-x-4">
        <Link className="text-green-600" to={`/students/${id}/edit`}>Edit</Link>
        <Link className="text-blue-600" to="/students">Back</Link>
      </div>
    </div>
    </Layout>
  );
}