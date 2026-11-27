import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  Users,
  ClipboardList,
  BarChart3,
  CheckSquare,
  PieChart,
  Folder,
  Megaphone,
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Batches", path: "/batches", icon: BookOpen },
  { label: "Live Classes", path: "/live-classes", icon: Video },
  { label: "Students", path: "/students", icon: Users },
  { label: "Assignments", path: "/assignments", icon: ClipboardList },
  { label: "Assessments", path: "/assessments", icon: BarChart3 },
  { label: "Attendance", path: "/attendance", icon: CheckSquare },
  { label: "Reports", path: "/reports", icon: PieChart },
  { label: "Resources", path: "/resources", icon: Folder },
  { label: "Announcements", path: "/announcements", icon: Megaphone },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#faf9fe] text-[#211e31]">
      <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 overflow-y-auto border-r border-[#efebf5] bg-white px-4 py-5 md:block">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-lg font-bold text-white shadow-[0_4px_12px_rgba(126,34,206,0.18)]">
            N
          </div>
          <div>
            <p className="text-[17px] font-bold leading-tight tracking-[-0.02em] text-[#171525]">Noor AI Labs</p>
            <p className="mt-0.5 text-[13px] font-medium text-[#77728a]">LMS - Trainer</p>
          </div>
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                    isActive
                      ? "bg-[#e9d5ff] text-[#5b168d] font-semibold shadow-[inset_3px_0_0_#7e22ce]"
                      : "text-[#596174] hover:bg-[#f8f6fc] hover:text-[#29253c]"
                  }`
                }
              >
                <Icon size={20} strokeWidth={1.9} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-[#efebf5] bg-white px-8 py-4">
          <div className="relative w-full max-w-[700px]">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#79738d]"
            />
            <input
              className="h-12 w-full rounded-xl border border-[#e8e1f6] bg-[#fbfaff] pl-11 pr-4 text-[14px] text-[#302c40] shadow-[0_2px_10px_rgba(79,57,125,0.05)] outline-none transition placeholder:text-[#89839a] focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              placeholder="Search students, batches, assignments..."
            />
          </div>
          <div className="ml-6 flex items-center gap-5">
            <button aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full text-[#57536b] transition hover:bg-[#f8f5fd]">
              <Bell size={22} strokeWidth={1.9} />
              <span className="absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
            </button>
            <button className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-1 text-left transition hover:bg-[#faf8fe]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efe4ff] text-[15px] font-bold text-purple-700 ring-2 ring-[#f8f3ff]">
                T
              </div>
              <span className="text-[15px] font-semibold text-[#252238]">Trainer</span>
              <ChevronDown size={16} className="text-[#716b83]" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
