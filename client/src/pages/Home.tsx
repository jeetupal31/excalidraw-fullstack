import type { FormEvent } from "react";
import { useState } from "react";
import { useBoardNavigation } from "../hooks/useBoardNavigation";

const featureHighlights = [
  {
    title: "Realtime drawing",
    description: "Collaborate instantly with synchronized scene updates over WebSockets.",
  },
  {
    title: "Live cursors and presence",
    description: "See where collaborators are active with shared cursors and a presence panel.",
  },
  {
    title: "Persistent boards",
    description: "Room state is saved in PostgreSQL so ideas stay available across sessions.",
  },
];

const workflowSteps = [
  "Create a board to generate a shareable board ID.",
  "Invite teammates with the board link or ID.",
  "Draw together and export board snapshots anytime.",
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

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-12 sm:px-10">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700">
              Realtime Collaboration
            </span>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Excalidraw-style whiteboarding for teams that ship fast.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-600">
              Create a board, share the link, and sketch together with low-latency updates,
              presence tracking, and PostgreSQL-backed persistence.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={handleCreateBoard}
                type="button"
              >
                Create Board
              </button>
            </div>
          </div>

          <form
            className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
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

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-soft">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Features</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {featureHighlights.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-soft lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">How it works</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              {workflowSteps.map((step) => (
                <li
                  key={step}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 leading-relaxed"
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl bg-slate-900 p-6 text-white">
            <h3 className="text-xl font-semibold">Start your next board session</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Generate a board instantly, collaborate in realtime, and export your work in PNG or
              JSON format.
            </p>
            <button
              className="mt-6 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-teal-400"
              onClick={handleCreateBoard}
              type="button"
            >
              Launch Board
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
