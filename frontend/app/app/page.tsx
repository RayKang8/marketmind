"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

type User = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type WatchlistItem = {
  id: string;
  ticker: string;
};

type Watchlist = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItem[];
};

export default function AppPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [meRes, watchlistsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/watchlists`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!meRes.ok) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const meData = await meRes.json();
        const watchlistsData = watchlistsRes.ok ? await watchlistsRes.json() : [];

        setUser(meData);
        setWatchlists(watchlistsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const createWatchlist = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!newWatchlistName.trim()) return;

    try {
      setCreating(true);

      const res = await fetch(`${API_BASE_URL}/api/watchlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newWatchlistName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to create watchlist:", data);
        return;
      }

      setWatchlists((prev) => [data, ...prev]);
      setNewWatchlistName("");
    } catch (err) {
      console.error("Create watchlist error:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-zinc-900">
        <p className="text-sm text-zinc-500">Loading MarketMind...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="flex min-h-screen">
        <aside className="w-[280px] border-r border-zinc-200 bg-zinc-50/70 p-4">
          <div className="flex h-full flex-col">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">MarketMind</h1>
              <p className="mt-1 text-sm text-zinc-500">
                AI-powered investment research
              </p>
            </div>

            <button className="mt-6 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100">
              + New Chat
            </button>

            <div className="mt-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Watchlists
              </h2>

              <div className="mb-3 flex gap-2">
                <input
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  placeholder="New watchlist"
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                />

                <button
                  onClick={createWatchlist}
                  disabled={creating}
                  className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "..." : "+"}
                </button>
              </div>

              <div className="space-y-2">
                {watchlists.length > 0 ? (
                  watchlists.map((watchlist) => (
                    <div
                      key={watchlist.id}
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm"
                    >
                      {watchlist.name}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No watchlists yet.</p>
                )}
              </div>
            </div>

            <div className="mt-auto border-t border-zinc-200 pt-4">
              <p className="text-sm font-medium text-zinc-900">
                {user?.email || "Unknown user"}
              </p>
              <button
                onClick={handleLogout}
                className="mt-3 w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Log out
              </button>
            </div>
          </div>
        </aside>

        <section className="flex flex-1 flex-col">
          <div className="border-b border-zinc-200 px-8 py-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Research Workspace
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Ask about stocks, market moves, sectors, and portfolio risk.
            </p>
          </div>

          <div className="flex flex-1 flex-col px-8 py-8">
            {error ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : (
              <>
                <div className="max-w-3xl space-y-4">
                  <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-4">
                    <p className="text-sm text-zinc-500">MarketMind</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-900">
                      Welcome back. This will become your AI-powered market research
                      workspace.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-4">
                    <p className="text-sm text-zinc-500">You</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-900">
                      Why is Nvidia up today?
                    </p>
                  </div>

                  <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-4">
                    <p className="text-sm text-zinc-500">MarketMind</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-900">
                      Placeholder response. Later this area will show LLM-powered,
                      data-backed stock analysis.
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <div className="max-w-3xl rounded-[28px] border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                    <input
                      type="text"
                      placeholder="Ask MarketMind about a stock or market event..."
                      className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}