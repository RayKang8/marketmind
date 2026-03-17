"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type Chat = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export default function AppPage() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");

  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [creatingWatchlist, setCreatingWatchlist] = useState(false);

  const [newTicker, setNewTicker] = useState("");
  const [addingTicker, setAddingTicker] = useState(false);

  const [messageInput, setMessageInput] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const selectedWatchlist = useMemo(() => {
    return watchlists.find((w) => w.id === selectedWatchlistId) || null;
  }, [watchlists, selectedWatchlistId]);

  const selectedChat = useMemo(() => {
    return chats.find((chat) => chat.id === selectedChatId) || null;
  }, [chats, selectedChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [meRes, watchlistsRes, chatsRes] = await Promise.all([
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
          fetch(`${API_BASE_URL}/api/chats`, {
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
        const chatsData = chatsRes.ok ? await chatsRes.json() : [];

        setUser(meData);
        setWatchlists(watchlistsData);
        setChats(chatsData);

        if (watchlistsData.length > 0) {
          setSelectedWatchlistId(watchlistsData[0].id);
        }

        if (chatsData.length > 0) {
          setSelectedChatId(chatsData[0].id);
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

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !selectedChatId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setMessagesLoading(true);

        const res = await fetch(`${API_BASE_URL}/api/chats/${selectedChatId}/messages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to fetch messages:", data);
          setMessages([]);
          return;
        }

        setMessages(data);
      } catch (err) {
        console.error("Fetch messages error:", err);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChatId]);

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

  const deleteWatchlist = async () => {
    const token = localStorage.getItem("token");

    if (!token || !selectedWatchlistId) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/watchlists/${selectedWatchlistId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to delete watchlist:", data);
        return;
      }

      const updatedWatchlists = watchlists.filter(
        (watchlist) => watchlist.id !== selectedWatchlistId
      );

      setWatchlists(updatedWatchlists);
      setSelectedWatchlistId(updatedWatchlists.length > 0 ? updatedWatchlists[0].id : null);
    } catch (err) {
      console.error("Delete watchlist error:", err);
    }
  };

  const createChat = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setCreatingChat(true);

      const res = await fetch(`${API_BASE_URL}/api/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "New Chat" }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to create chat:", data);
        return;
      }

      setChats((prev) => [data, ...prev]);
      setSelectedChatId(data.id);
      setMessages([]);
    } catch (err) {
      console.error("Create chat error:", err);
    } finally {
      setCreatingChat(false);
    }
  };

  const sendMessage = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!messageInput.trim()) return;

    let chatId = selectedChatId;

    try {
      setSendingMessage(true);

      if (!chatId) {
        const createRes = await fetch(`${API_BASE_URL}/api/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: messageInput.trim().slice(0, 40) || "New Chat",
          }),
        });

        const newChat = await createRes.json();

        if (!createRes.ok) {
          console.error("Failed to auto-create chat:", newChat);
          return;
        }

        setChats((prev) => [newChat, ...prev]);
        setSelectedChatId(newChat.id);
        chatId = newChat.id;
      }

      const res = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: messageInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to send message:", data);
        return;
      }

      setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
      setMessageInput("");

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title:
                  chat.title === "New Chat"
                    ? data.userMessage.content.slice(0, 40)
                    : chat.title,
                updatedAt: new Date().toISOString(),
              }
            : chat
        )
      );
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center bg-white text-zinc-900">
        <p className="text-sm text-zinc-500">Loading MarketMind...</p>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-white text-zinc-900">
      <div className="flex h-full">
        <aside className="flex h-full w-[300px] flex-col border-r border-zinc-200 bg-zinc-50/70 p-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">MarketMind</h1>
            <p className="mt-1 text-sm text-zinc-500">
              AI-powered investment research
            </p>
          </div>

          <button
            onClick={createChat}
            disabled={creatingChat}
            className="mt-6 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingChat ? "Creating..." : "+ New Chat"}
          </button>

          <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1">
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Saved Chats
              </h2>

              <div className="space-y-2">
                {chats.length > 0 ? (
                  chats.map((chat) => {
                    const isSelected = selectedChatId === chat.id;

                    return (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          isSelected
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                        }`}
                      >
                        <div className="truncate font-medium">{chat.title}</div>
                        <div
                          className={`mt-1 text-xs ${
                            isSelected ? "text-zinc-300" : "text-zinc-500"
                          }`}
                        >
                          Saved conversation
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-zinc-500">No chats yet.</p>
                )}
              </div>
            </div>

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
          </div>

          <div className="mt-4 border-t border-zinc-200 pt-4">
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
        </aside>

        <section className="flex min-w-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-zinc-200 px-8 py-6">
              <h2 className="truncate text-2xl font-semibold tracking-tight">
                {selectedChat ? selectedChat.title : "Research Workspace"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ask about stocks, market moves, sectors, and portfolio risk.
              </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-8 py-6">
              {error ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                    {messagesLoading ? (
                      <p className="text-sm text-zinc-500">Loading messages...</p>
                    ) : messages.length > 0 ? (
                      <div className="max-w-3xl space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`rounded-3xl border px-5 py-4 ${
                              message.role === "assistant"
                                ? "border-zinc-200 bg-zinc-50"
                                : "border-zinc-200 bg-white"
                            }`}
                          >
                            <p className="text-sm text-zinc-500">
                              {message.role === "assistant" ? "MarketMind" : "You"}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-900">
                              {message.content}
                            </p>
                          </div>
                        ))}
                        <div ref={bottomRef} />
                      </div>
                    ) : (
                      <div className="max-w-3xl space-y-4">
                        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-4">
                          <p className="text-sm text-zinc-500">MarketMind</p>
                          <p className="mt-2 text-sm leading-7 text-zinc-900">
                            Ask about any stock, market move, sector trend, or your
                            watchlist. This chat system is now wired into your backend.
                          </p>
                        </div>
                        <div ref={bottomRef} />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 shrink-0 pt-2">
                    <div className="max-w-3xl rounded-[28px] border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          placeholder="Ask MarketMind about a stock or market event..."
                          className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={sendingMessage}
                          className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {sendingMessage ? "..." : "Send"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className="flex h-full w-[360px] flex-col border-l border-zinc-200 bg-zinc-50/40 px-6 py-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Watchlist Panel
            </h3>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              {selectedWatchlist ? (
                <div>
                  <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-zinc-500">Selected Watchlist</p>
                        <p className="mt-2 text-base font-medium text-zinc-900">
                          {selectedWatchlist.name}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-zinc-600">
                          Add and manage stock tickers here. Later this watchlist will
                          power AI analysis, alerts, and research summaries.
                        </p>
                      </div>

                      <button
                        onClick={deleteWatchlist}
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
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
                      {addingTicker ? "..." : "Add"}
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedWatchlist.items.length > 0 ? (
                      selectedWatchlist.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-zinc-900">
                              {item.ticker}
                            </p>
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
                <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-500">
                  Select or create a watchlist to manage your saved stocks.
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}