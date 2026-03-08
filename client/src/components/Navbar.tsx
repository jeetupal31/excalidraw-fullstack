import { NavLink } from "react-router-dom";
import { useBoardNavigation } from "../hooks/useBoardNavigation";

export function Navbar() {
  const { createBoard } = useBoardNavigation();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 sm:px-10">
        <div className="flex items-center gap-5">
          <NavLink className="text-base font-semibold tracking-tight text-slate-900" to="/">
            Excalidraw Live Clone
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `text-sm transition-colors ${
                isActive ? "font-semibold text-teal-700" : "text-slate-600 hover:text-slate-900"
              }`
            }
            end
            to="/"
          >
            Home
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            onClick={createBoard}
            type="button"
          >
            New Board
          </button>
          <a
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            href="https://github.com"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}
