import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../components/layout/AdminLayout.jsx";
import { deleteMessage, fetchMessages, updateMessage } from "../utils/storage.js";

const PAGE_SIZE = 10;

const toneClasses = [
  "bg-blue-50 text-blue-600",
  "bg-violet-50 text-violet-600",
  "bg-emerald-50 text-emerald-600",
  "bg-orange-50 text-orange-600",
  "bg-fuchsia-50 text-fuchsia-600",
];

function timeAgo(value) {
  if (!value) return "Recently";
  const diff = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hour${Math.floor(diff / hour) === 1 ? "" : "s"} ago`;
  return `${Math.floor(diff / day)} day${Math.floor(diff / day) === 1 ? "" : "s"} ago`;
}

function normalizeMessage(message, index) {
  return {
    ...message,
    initials: message.initials || (message.name || "?").slice(0, 2).toUpperCase(),
    preview: message.preview || message.message || "",
    received: timeAgo(message.createdAt),
    tone: toneClasses[index % toneClasses.length],
  };
}

export default function AdminMessages() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const loadMessages = async () => {
    setError("");
    setLoading(true);
    try {
      const inbox = await fetchMessages();
      setMessages(inbox.map(normalizeMessage));
    } catch (err) {
      setError(err?.message || "Could not load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const counts = useMemo(
    () => ({
      All: messages.length,
      Unread: messages.filter((message) => message.status === "Unread").length,
      Read: messages.filter((message) => message.status === "Read").length,
    }),
    [messages]
  );

  const visibleMessages = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return messages.filter((message) => {
      const matchesFilter = activeFilter === "All" || message.status === activeFilter;
      const text = `${message.name} ${message.email} ${message.subject} ${message.preview}`.toLowerCase();
      return matchesFilter && (!needle || text.includes(needle));
    });
  }, [activeFilter, messages, query]);

  const pageCount = Math.max(1, Math.ceil(visibleMessages.length / PAGE_SIZE));
  const pageRows = visibleMessages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, query]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  const markAsRead = async (message) => {
    const updated = await updateMessage(message.id, { status: "Read" });
    setMessages((current) =>
      current.map((item, index) => (item.id === message.id ? normalizeMessage(updated, index) : item))
    );
    setSelectedMessage((current) =>
      current?.id === message.id ? normalizeMessage(updated, 0) : current
    );
  };

  const removeMessage = async (message) => {
    await deleteMessage(message.id);
    setMessages((current) => current.filter((item) => item.id !== message.id));
    setSelectedMessage(null);
  };

  return (
    <AdminLayout
      title="Messages"
      subtitle="Live contact form submissions from your portfolio."
      pageClassName="bg-[#f5f6f8]"
    >
      <section className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white/65 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
        <div className="flex flex-col gap-4 border-b border-black/[0.06] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search messages..."
              className="h-12 w-full rounded-2xl border border-black/[0.08] bg-white/75 pl-11 pr-4 text-sm text-black outline-none transition placeholder:text-zinc-400 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {["All", "Unread", "Read"].map((label) => {
              const active = activeFilter === label;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveFilter(label)}
                  className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-50 text-blue-600 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.08)]"
                      : "text-zinc-600 hover:bg-black/[0.035] hover:text-black"
                  }`}
                >
                  {label}
                  <span
                    className={`grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      active ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {counts[label]}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={loadMessages}
            className="h-10 rounded-xl border border-black/[0.08] bg-white/75 px-4 text-sm font-bold text-zinc-700 transition hover:bg-white"
          >
            Refresh
          </button>
        </div>

        <div className="hidden grid-cols-[1.25fr_1fr_1.55fr_0.65fr_0.55fr_auto] gap-5 border-b border-black/[0.06] bg-white/45 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400 xl:grid">
          <span>Sender</span>
          <span>Subject</span>
          <span>Message preview</span>
          <span>Received</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {error && (
          <div className="border-b border-red-500/10 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="divide-y divide-black/[0.055]">
          {loading ? (
            <EmptyState title="Loading messages..." text="Checking the backend inbox." />
          ) : visibleMessages.length === 0 ? (
            <EmptyState title="No messages found" text="New contact form submissions will appear here." />
          ) : (
            pageRows.map((message) => (
              <article
                key={message.id}
                className="group grid gap-4 px-4 py-4 transition hover:bg-white/65 sm:px-5 xl:grid-cols-[1.25fr_1fr_1.55fr_0.65fr_0.55fr_auto] xl:items-center xl:gap-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-black ${message.tone}`}
                  >
                    {message.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-black">{message.name}</p>
                    <p className="truncate text-sm text-zinc-500">{message.email}</p>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 xl:hidden">
                    Subject
                  </p>
                  <p className="truncate text-sm font-semibold text-zinc-800">{message.subject}</p>
                </div>

                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 xl:hidden">
                    Message
                  </p>
                  <p className="line-clamp-2 text-sm leading-6 text-zinc-600">{message.preview}</p>
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 xl:hidden">
                    Received
                  </p>
                  <p className="text-sm text-zinc-500">{message.received}</p>
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 xl:hidden">
                    Status
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm text-zinc-600">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        message.status === "Unread" ? "bg-blue-500" : "bg-zinc-400"
                      }`}
                    />
                    {message.status}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMessage(message)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white/80 px-4 text-sm font-bold text-black shadow-sm transition hover:-translate-y-0.5 hover:border-black/15 hover:bg-white"
                >
                  <Eye size={16} />
                  View
                </button>
              </article>
            ))
          )}
        </div>

        <footer className="flex flex-col gap-4 border-t border-black/[0.06] bg-white/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-zinc-500">
            Showing <span className="font-semibold text-black">{pageRows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, visibleMessages.length)}</span> of{" "}
            <span className="font-semibold text-black">{messages.length}</span> messages
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-xl border border-black/[0.08] bg-white/80 text-zinc-500 transition hover:bg-white hover:text-black"
              aria-label="Previous page"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="grid h-9 min-w-9 place-items-center rounded-xl bg-blue-50 px-3 text-sm font-bold text-blue-600"
            >
              1
            </button>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-xl border border-black/[0.08] bg-white/80 text-zinc-500 transition hover:bg-white hover:text-black"
              aria-label="Next page"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page === pageCount}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>

      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-sm"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_30px_100px_rgba(15,23,42,0.22)] backdrop-blur-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-black/[0.06] p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  Contact submission
                </p>
                <h3 className="mt-1 text-2xl font-black tracking-[-0.03em] text-black">
                  {selectedMessage.subject}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-black/[0.07] bg-white/70 text-zinc-500 transition hover:bg-white hover:text-black"
                aria-label="Close message"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white/65 p-4">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl text-sm font-black ${selectedMessage.tone}`}
                >
                  {selectedMessage.initials}
                </div>
                <div>
                  <p className="font-bold text-black">{selectedMessage.name}</p>
                  <p className="text-sm text-zinc-500">{selectedMessage.email}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  Message
                </p>
                <div className="rounded-2xl border border-black/[0.06] bg-white/60 p-4 text-sm leading-7 text-zinc-700">
                  {selectedMessage.message || selectedMessage.preview}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/[0.06] bg-white/55 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                    Received
                  </p>
                  <p className="mt-1 text-sm font-semibold text-black">{selectedMessage.received}</p>
                </div>
                <div className="rounded-2xl border border-black/[0.06] bg-white/55 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-black">{selectedMessage.status}</p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => removeMessage(selectedMessage)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/15 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Delete
                </button>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => markAsRead(selectedMessage)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-black/[0.08] bg-white/80 px-4 text-sm font-bold text-black transition hover:bg-white"
                  >
                    <Check size={16} />
                    Mark as read
                  </button>
                  <a
                    href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(`Re: ${selectedMessage.subject}`)}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5"
                  >
                    <Mail size={16} />
                    Email sender
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="px-5 py-12 text-center">
      <strong className="block text-sm font-bold text-black">{title}</strong>
      <p className="mt-1 text-sm text-zinc-500">{text}</p>
    </div>
  );
}
