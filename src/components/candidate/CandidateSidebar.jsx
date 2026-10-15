"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, FileText, ClipboardList, LogOut, Brain, Menu, X, Settings, PenLine, FlaskConical } from "lucide-react";

const NAV = [
  { label:"Dashboard",      icon: LayoutDashboard, href:"/candidate/dashboard"       },
  { label:"Browse Jobs",    icon: Briefcase,       href:"/candidate/jobs"            },
  { label:"My Resume",      icon: FileText,        href:"/candidate/resume"          },
  { label:"Applications",   icon: ClipboardList,   href:"/candidate/applications"    },
  { label:"Resume Builder", icon: PenLine,         href:"/candidate/resume-builder"  },
  { label:"Skill Test",     icon: FlaskConical,    href:"/candidate/skill-test"      },
  { label:"Settings",       icon: Settings,        href:"/candidate/settings"        },
];

export default function CandidateSidebar({ user }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("candidate_user");
    router.push("/");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#0B1D3A] text-white p-2 rounded-xl">
        <Menu size={20}/>
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}/>
      )}

      <div className={`w-56 bg-[#0B1D3A] min-h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>

        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#10B981] rounded-xl flex items-center justify-center">
              <Brain size={18} className="text-white"/>
            </div>
            <div>
              <div className="text-white font-bold text-sm">ASSISTLANA</div>
              <div className="text-[#10B981] text-xs">Candidate Portal</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden text-white/60">
            <X size={18}/>
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3 px-2">My Portal</div>
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <button key={item.label}
                onClick={() => { router.push(item.href); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}>
                <Icon size={16}/>{item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <div className="text-white text-xs font-semibold">{user?.name}</div>
              <div className="text-white/40 text-xs">Candidate</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all">
            <LogOut size={14}/>Logout
          </button>
        </div>
      </div>
    </>
  );
}