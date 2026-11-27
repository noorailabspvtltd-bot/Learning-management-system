import axios from "axios";
import type { Student, Paginated } from "../types/student";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
});

export const getStudents = (page = 1, search = "") =>
  api.get<Paginated<Student>>("/students/", { params: { page, search } });

export const getStudent = (id: string) => api.get<Student>(`/students/${id}/`);

export const createStudent = (data: Student) => api.post("/students/", data);

export const updateStudent = (id: string, data: Student) =>
  api.put(`/students/${id}/`, data);

export const deleteStudent = (id: number) => api.delete(`/students/${id}/`);