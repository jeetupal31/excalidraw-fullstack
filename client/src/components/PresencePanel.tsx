import { useState } from "react";
import { Users } from "lucide-react";
import type { PresenceUsers } from "../types/collaboration";

interface PresencePanelProps {
  users: PresenceUsers;
}

export function PresencePanel({ users }: PresencePanelProps) {
  const userNames = Object.values(users);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="absolute right-2 top-[72px] z-10 sm:right-4 sm:top-[72px]"
      style={{ minWidth: collapsed ? "auto" : 160 }}
    >
      <div className="rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur">
        <button
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
          onClick={() => setCollapsed(!collapsed)}
          type="button"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-slate-900 sm:text-sm">
            <Users size={16} strokeWidth={2.5} className="text-indigo-600 dark:text-indigo-400" />
            {userNames.length > 0 ? `Active (${userNames.length})` : "Users"}
          </span>
          <svg
            className={`h-3.5 w-3.5 text-slate-500 transition-transform ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {!collapsed && (
          <div className="border-t border-slate-100 px-3 pb-2 pt-1">
            {userNames.length === 0 ? (
              <span className="block py-1 text-xs text-slate-400">Waiting for others...</span>
            ) : (
              <div className="flex flex-col gap-1">
                {userNames.map((name) => (
                  <span
                    key={name}
                    className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-slate-700"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
