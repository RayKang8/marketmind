"use client";

import { useEffect, useMemo, useState } from "react";
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
  watchlistId: string;
  createdAt?: string;
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
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [creatingWatchlist, setCreatingWatchlist] = useState(false);

  const [newTicker, setNewTicker] = useState("");
  const [addingTicker, setAddingTicker] = useState(false);

  const selectedWatchlist = useMemo(() => {
    return watchlists.find((w) => w.id === selectedWatchlistId) || null;
  }, [watchlists, selectedWatchlistId]);

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

        if (watchlistsData.length > 0) {
          setSelectedWatchlistId(watchlistsData[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const createWatchlist = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!newWatchlistName.trim()) return;

    try {
      setCreatingWatchlist(true);

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
      setSelectedWatchlistId(data.id);
      setNewWatchlistName("");
    } catch (err) {
      console.error("Create watchlist error:", err);
    } finally {
      setCreatingWatchlist(false);
    }
  };

  const addTickerToWatchlist = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!selectedWatchlistId || !newTicker.trim()) return;

    try {
      setAddingTicker(true);

      const res = await fetch(
        `${API_BASE_URL}/api/watchlists/${selectedWatchlistId}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ticker: newTicker.trim().toUpperCase() }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to add ticker:", data);
        return;
      }

      setWatchlists((prev) =>
        prev.map((watchlist) =>
          watchlist.id === selectedWatchlistId
            ? { ...watchlist, items: [...watchlist.items, data] }
            : watchlist
        )
      );

      setNewTicker("");
    } catch (err) {
      console.error("Add ticker error:", err);
    } finally {
      setAddingTicker(false);
    }
  };

  const removeTickerFromWatchlist = async (itemId: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!selectedWatchlistId) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/watchlists/${selectedWatchlistId}/items/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to remove ticker:", data);
        return;
      }

      setWatchlists((prev) =>
        prev.map((watchlist) =>
          watchlist.id === selectedWatchlistId
            ? {
                ...watchlist,
                items: watchlist.items.filter((item) => item.id !== itemId),
              }
            : watchlist
        )
      );
    } catch (err) {
      console.error("Remove ticker error:", err);
    }
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
                  disabled={creatingWatchlist}
                  className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingWatchlist ? "..." : "+"}
                </button>
              </div>

              <div className="space-y-2">
                {watchlists.length > 0 ? (
                  watchlists.map((watchlist) => {
                    const isSelected = selectedWatchlistId === watchlist.id;

                    return (
                      <button
                        key={watchlist.id}
                        onClick={() => setSelectedWatchlistId(watchlist.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          isSelected
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                        }`}
                      >
                        <div className="font-medium">{watchlist.name}</div>
                        <div
                          className={`mt-1 text-xs ${
                            isSelected ? "text-zinc-300" : "text-zinc-500"
                          }`}
                        >
                          {watchlist.items.length} stock
                          {watchlist.items.length === 1 ? "" : "s"}
                        </div>
                      </button>
                    );
                  })
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
              {selectedWatchlist ? selectedWatchlist.name : "Research Workspace"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {selectedWatchlist
                ? "Manage stocks in this watchlist."
                : "Ask about stocks, market moves, sectors, and portfolio risk."}
            </p>
          </div>

          <div className="flex flex-1 flex-col px-8 py-8">
            {error ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : selectedWatchlist ? (
              <div className="max-w-3xl">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-4">
                  <p className="text-sm text-zinc-500">Selected Watchlist</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-900">
                    Add and manage stock tickers here. Later this watchlist will be used
                    for AI analysis, alerts, and portfolio-style insights.
                  </p>
                </div>

                <div className="mt-6 flex gap-2">
                  <input
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value)}
                    placeholder="Add ticker (e.g. NVDA)"
                    className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                  />
                  <button
                    onClick={addTickerToWatchlist}
                    disabled={addingTicker}
                    className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {addingTicker ? "Adding..." : "Add"}
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  {selectedWatchlist.items.length > 0 ? (
                    selectedWatchlist.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{item.ticker}</p>
                          <p className="text-xs text-zinc-500">Saved to watchlist</p>
                        </div>

                        <button
                          onClick={() => removeTickerFromWatchlist(item.id)}
                          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-500">
                      No stocks in this watchlist yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl space-y-4">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-4">
                  <p className="text-sm text-zinc-500">MarketMind</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-900">
                    Create a watchlist in the sidebar to start organizing stocks.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}