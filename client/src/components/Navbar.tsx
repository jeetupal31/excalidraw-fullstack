import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { 
  Plus, 
  LogOut, 
  User, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  LayoutDashboard
} from "lucide-react";
import { useBoardNavigation } from "../hooks/useBoardNavigation";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export function Navbar() {
  const { createBoard } = useBoardNavigation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-4 sm:px-8 sm:pt-6">
      <nav className="glass-panel mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl px-5 py-3 transition-all duration-300">
        <div className="flex items-center gap-8">
          <NavLink className="flex items-center gap-3 text-base font-bold tracking-tight text-slate-900 dark:text-white" to="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 font-serif text-lg font-black text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-900 dark:shadow-white/5">
              E
            </div>
            <span className="hidden sm:inline-block font-bold">
              Excali<span className="font-medium text-slate-400 dark:text-zinc-500">Live</span>
            </span>
          </NavLink>
          
          <div className="hidden items-center gap-6 md:flex">
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-2 text-[13px] font-bold tracking-wide transition-all ${
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-zinc-200"
                }`
              }
              end
              to="/"
            >
              <LayoutDashboard size={16} />
              Workspace
            </NavLink>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 sm:flex">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/50 bg-slate-50/50 text-slate-500 transition-all hover:bg-white hover:text-slate-900 dark:border-white/5 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-amber-300"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800" />
              <div className="flex items-center gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-1.5 text-xs font-bold tracking-wide text-indigo-700 backdrop-blur-sm dark:border-indigo-900/30 dark:bg-indigo-500/10 dark:text-indigo-400">
                <User size={14} strokeWidth={3} />
                {user?.username}
              </div>
              <button
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-bold tracking-wide text-white transition-all hover:bg-indigo-600 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
                onClick={createBoard}
                type="button"
              >
                <Plus size={16} strokeWidth={3} />
                New Board
              </button>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                onClick={logout}
                title="Sign Out"
                type="button"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                className="text-[13px] font-bold text-slate-600 transition hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                to="/login"
              >
                Sign In
              </Link>
              <button
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-[13px] font-bold tracking-wide text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
                onClick={createBoard}
                type="button"
              >
                Launch
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu items */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/50 bg-slate-50/50 text-slate-500 dark:border-white/5 dark:bg-zinc-800/50 dark:text-zinc-400"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="glass-panel absolute inset-x-4 top-20 rounded-xl p-5 shadow-2xl sm:hidden">
          <div className="flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-zinc-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                    <User size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest leading-none mb-1">Authenticated</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{user?.username}</span>
                  </div>
                </div>
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3.5 text-[13px] font-bold text-white dark:bg-white dark:text-slate-900"
                  onClick={() => {
                    createBoard();
                    setMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  <Plus size={18} />
                  New Board
                </button>
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-[13px] font-bold text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  className="w-full rounded-lg bg-slate-900 px-4 py-3.5 text-[13px] font-bold text-white dark:bg-white dark:text-slate-900"
                  onClick={() => {
                    createBoard();
                    setMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  Launch App
                </button>
                <Link
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-[13px] font-bold text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
