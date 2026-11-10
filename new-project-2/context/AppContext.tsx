"use client";
import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string;
  bio: string;
  verified?: boolean;
  role?: "user" | "moderator";
}

export interface Comment {
  id: number;
  userId: number;
  text: string;
  createdAt: number;
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
  likes: number;
  likedBy: number[];
  isAnonymous: boolean;
  revealLikes: number;
  comments: Comment[];
  createdAt: number;
}

export function formatTimeAgo(timestamp: number, nowTime: number) {
  const diff = nowTime - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Только что";
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч`;
  return `${Math.floor(hours / 24)} дн`;
}

export function TimeAgo({ timestamp }: { timestamp: number }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null; 
  return <span>{formatTimeAgo(timestamp, now)}</span>;
}

const avatar = (seed: string, bg: string) => `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&scale=82&backgroundColor=${bg}`;

const MOCK_USERS: Record<number, User> = {
  1: { id: 1, username: "temirlan", firstName: "Темирлан", lastName: "Кулсаринов", image: avatar("temirlan", "e9d5ff"), bio: "Software Engineer / CS Student. Создатель.", verified: true, role: "moderator" },
  2: { id: 2, username: "dinmukhammad", firstName: "Динмухаммад", lastName: "Дауренбеков", image: avatar("din", "bfdbfe"), bio: "CEO, визионер.", verified: true },
  3: { id: 3, username: "aituar", firstName: "Айтуар", lastName: "Байбурин", image: avatar("aituar", "fde68a"), bio: "Веб-дизайнер." },
};

const nowMock = Date.now();
const post = (id: number, userId: number, title: string, body: string, likes: number, isAnonymous: boolean, revealLikes: number, timeOffset: number, comments: Comment[] = []): Post => ({
  id, userId, title, body, likes, likedBy: [], isAnonymous, revealLikes, comments, createdAt: nowMock - timeOffset
});

const INITIAL_POSTS: Post[] = [
  post(101, 1, "Тёмная тема и Комментарии", "Теперь всё работает в дарк моде, а еще мы добавили комменты! Тестируем.", 6, false, 5, 1000 * 60 * 5, [
    { id: 1, userId: 2, text: "Выглядит пушка! 🔥", createdAt: nowMock - 1000 * 60 * 3 },
    { id: 2, userId: 3, text: "Дизайн стал еще чище.", createdAt: nowMock - 1000 * 60 * 1 }
  ]),
  post(102, 3, "Секрет дизайнера", "Я спрятал пасхалку в макете. Попробуйте найти.", 12, true, 15, 1000 * 60 * 45),
  post(103, 2, "Планы на Q4", "Готовим мобильное приложение. Скоро покажу первые наброски.", 25, false, 10, 1000 * 60 * 60 * 3, [
    { id: 3, userId: 1, text: "Ждем релиза!", createdAt: nowMock - 1000 * 60 * 60 * 2 }
  ]),
];

interface AppContextType {
  posts: Post[];
  users: Record<number, User>;
  currentUser: User;
  theme: "light" | "dark";
  profileId: number | null;
  isModerator: boolean;
  switchAccount: (id: number) => void;
  toggleTheme: () => void;
  openProfile: (id: number | null) => void;
  updateUser: (id: number, firstName: string, lastName: string, bio: string) => void;
  addPost: (title: string, body: string, revealLikes: number) => void;
  updatePost: (id: number, title: string, body: string) => void;
  deletePost: (id: number) => void;
  toggleLike: (postId: number) => void;
  addComment: (postId: number, text: string) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

// Измененный ключ кэша — сбросит старые сломанные данные у тебя в браузере
const STORAGE_KEY = "secretspace-v3";
const THEME_KEY = "secretspace-theme";

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [users, setUsers] = useState<Record<number, User>>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = useState<number>(1);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profileId, setProfileId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.posts)) {
          setPosts(saved.posts.map((p: any) => ({
            ...p,
            comments: p.comments || [],
            createdAt: p.createdAt || Date.now() - Math.floor(Math.random() * 10000000)
          })));
        }
        if (saved.users) {
          const merged: Record<number, User> = { ...MOCK_USERS };
          for (const id of Object.keys(MOCK_USERS).map(Number)) {
            const s = saved.users[id];
            if (s) {
              merged[id] = { ...MOCK_USERS[id], firstName: s.firstName ?? MOCK_USERS[id].firstName, lastName: s.lastName ?? MOCK_USERS[id].lastName, bio: s.bio ?? MOCK_USERS[id].bio };
            }
          }
          setUsers(merged);
        }
        if (typeof saved.currentUserId === "number") setCurrentUserId(saved.currentUserId);
      }
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ posts, users, currentUserId })); } catch {}
  }, [posts, users, currentUserId, hydrated]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (!hydrated) return;
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme, hydrated]);

  const currentUser = users[currentUserId] ?? users[1];
  const isModerator = currentUser.role === "moderator";

  const toggleTheme = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), []);
  const switchAccount = useCallback((id: number) => setCurrentUserId(id), []);
  const openProfile = useCallback((id: number | null) => {
    setProfileId(id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);
  const updateUser = useCallback((id: number, firstName: string, lastName: string, bio: string) => {
    setUsers((prev) => ({ ...prev, [id]: { ...prev[id], firstName, lastName, bio } }));
  }, []);

  const addPost = useCallback((title: string, body: string, revealLikes: number) => {
    const newPost: Post = { id: Date.now(), userId: currentUserId, title, body, likes: 0, likedBy: [], isAnonymous: true, revealLikes, comments: [], createdAt: Date.now() };
    setPosts((prev) => [newPost, ...prev]);
  }, [currentUserId]);

  const updatePost = useCallback((id: number, title: string, body: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, title, body } : p)));
  }, []);

  const deletePost = useCallback((id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id || !(p.userId === currentUserId || isModerator)));
  }, [currentUserId, isModerator]);

  const addComment = useCallback((postId: number, text: string) => {
    const newComment: Comment = { id: Date.now(), userId: currentUserId, text, createdAt: Date.now() };
    setPosts((prev) => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
  }, [currentUserId]);

  const toggleLike = useCallback((postId: number) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId || p.userId === currentUserId) return p;
      const alreadyLiked = p.likedBy.includes(currentUserId);
      if (alreadyLiked) return { ...p, likes: Math.max(0, p.likes - 1), likedBy: p.likedBy.filter((id) => id !== currentUserId) };
      const likes = p.likes + 1;
      return { ...p, likes, likedBy: [...p.likedBy, currentUserId], isAnonymous: p.isAnonymous && likes < p.revealLikes };
    }));
  }, [currentUserId]);

  const value = useMemo(() => ({
    posts, users, currentUser, theme, profileId, isModerator,
    switchAccount, toggleTheme, openProfile, updateUser, addPost, updatePost, deletePost, toggleLike, addComment
  }), [posts, users, currentUser, theme, profileId, isModerator, switchAccount, toggleTheme, openProfile, updateUser, addPost, updatePost, deletePost, toggleLike, addComment]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}