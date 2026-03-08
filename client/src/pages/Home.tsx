import type { FormEvent } from "react";
import { useState } from "react";
import { useBoardNavigation } from "../hooks/useBoardNavigation";

const featureHighlights = [
  {
    icon: "⚡",
    title: "Realtime Drawing",
    description: "Collaborate instantly with synchronized scene updates over WebSockets.",
  },
  {
    icon: "👥",
    title: "Live Cursors & Presence",
    description: "See where collaborators are active with shared cursors and a presence panel.",
  },
  {
    icon: "💾",
    title: "Persistent Boards",
    description: "Room state is saved in PostgreSQL so ideas stay available across sessions.",
  },
];

const workflowSteps = [
  { step: "01", text: "Create a board to generate a shareable board ID." },
  { step: "02", text: "Invite teammates with the board link or ID." },
  { step: "03", text: "Draw together and export board snapshots anytime." },
];

export function Home() {
  const [joinBoardIdInput, setJoinBoardIdInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const { createBoard, joinBoard } = useBoardNavigation();

  const handleCreateBoard = () => {
    setJoinError(null);
    createBoard();
  };

  const handleJoinBoard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = joinBoard(joinBoardIdInput);

    if (!result.success) {
      setJoinError(result.error ?? "Could not join this board.");
      return;
    }

    setJoinError(null);
  };

  return (
    <div className="relative h-full overflow-y-auto">
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-white via-teal-50/60 to-slate-100" />
      <div className="absolute inset-0 -z-10 bg-grid-pattern bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_70%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:gap-14 sm:px-6 md:px-10 md:py-12">
        {/* Hero Section */}
        <section className="grid gap-8 sm:gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700">
              Realtime Collaboration
            </span>
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">ExcaliDraw Live</span>
              <br />
              <span className="text-slate-800">Whiteboarding for teams that ship fast.</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Create a board, share the link, and sketch together with low-latency updates,
              presence tracking, and PostgreSQL-backed persistence.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:shadow-teal-500/40 hover:brightness-110"
                onClick={handleCreateBoard}
                type="button"
              >
                ✨ Create Board
              </button>
            </div>
          </div>

          <form
            className="h-fit rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-soft backdrop-blur sm:p-6"
            onSubmit={handleJoinBoard}
          >
            <h2 className="text-lg font-semibold text-slate-900">Join Board</h2>
            <p className="mt-2 text-sm text-slate-600">
              Paste a board ID to continue collaborating with your team.
            </p>
            <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Board ID
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none ring-teal-500 transition focus:border-teal-500 focus:ring-2"
              onChange={(event) => setJoinBoardIdInput(event.target.value)}
              placeholder="e.g. abc123"
              type="text"
              value={joinBoardIdInput}
            />
            {joinError ? <p className="mt-2 text-sm text-rose-700">{joinError}</p> : null}
            <button
              className="mt-4 w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
              type="submit"
            >
              Join Board
            </button>
          </form>
        </section>

        {/* Features Section */}
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-soft backdrop-blur sm:p-7">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Features</h2>
          <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 md:grid-cols-3">
            {featureHighlights.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 transition hover:border-teal-200 hover:shadow-md"
              >
                <span className="mb-2 block text-2xl">{feature.icon}</span>
                <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works + CTA */}
        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-soft backdrop-blur sm:p-7 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">How it works</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              {workflowSteps.map((item) => (
                <li
                  key={item.step}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 leading-relaxed"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                    {item.step}
                  </span>
                  <span className="pt-0.5">{item.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
            <h3 className="text-lg font-bold sm:text-xl">Start your next board session</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Generate a board instantly, collaborate in realtime, and export your work in PNG or
              JSON format.
            </p>
            <button
              className="mt-6 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:brightness-110"
              onClick={handleCreateBoard}
              type="button"
            >
              🚀 Launch Board
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 pb-6 pt-6 text-center text-xs text-slate-500">
          Built by{" "}
          <a
            className="font-medium text-teal-600 transition hover:text-teal-700"
            href="https://github.com/jeetupal31"
            rel="noreferrer"
            target="_blank"
          >
            @jeetupal31
          </a>
          {" "}· ExcaliDraw Live
        </footer>
      </div>
    </div>
  );
}
