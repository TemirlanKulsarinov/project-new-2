"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string;
  bio: string;
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
  likes: number;
  isAnonymous: boolean;
  revealLikes: number;
}

const MOCK_USERS: Record<number, User> = {
  1: { id: 1, username: "temirlan", firstName: "Темирлан", lastName: "Кулсаринов", image: "https://api.dicebear.com/7.x/notionists/svg?seed=temirlan", bio: "Software Engineer / CS Student. Создатель." },
  2: { id: 2, username: "dinmukhammad", firstName: "Динмухаммад", lastName: "Дауренбеков", image: "https://api.dicebear.com/7.x/notionists/svg?seed=din", bio: "CEO, визионер." },
  3: { id: 3, username: "aituar", firstName: "Айтуар", lastName: "Байбурин", image: "https://api.dicebear.com/7.x/notionists/svg?seed=aituar", bio: "Веб-дизайнер." },
};

const INITIAL_POSTS: Post[] = [
  { id: 101, userId: 1, title: "Тёмная тема", body: "Теперь всё работает в дарк моде. И инста-лайки тоже здесь!", likes: 6, isAnonymous: false, revealLikes: 5 },
  { id: 102, userId: 3, title: "Секрет дизайнера", body: "Я спрятал пасхалку в макете. Попробуйте найти, когда этот пост наберет лайки.", likes: 12, isAnonymous: true, revealLikes: 15 },
  { id: 103, userId: 2, title: "Планы на Q4", body: "Готовим мобильное приложение на React Native. Скоро покажу первые наброски интерфейса.", likes: 25, isAnonymous: false, revealLikes: 10 },
  { id: 104, userId: 1, title: "Анимации фона", body: "Оцените задний фон, он реагирует на скролл! Писал логику синхронизации около часа.", likes: 2, isAnonymous: true, revealLikes: 5 },
  { id: 105, userId: 3, title: "Минимализм", body: "Профили теперь открываются на весь экран. Никаких модалок, только чистый контент.", likes: 8, isAnonymous: false, revealLikes: 5 },
  { id: 106, userId: 2, title: "Инсайд с планерки", body: "Завтра анонсируем новую фичу для портфолио. Конкуренты будут плакать.", likes: 4, isAnonymous: true, revealLikes: 10 },
  { id: 107, userId: 1, title: "Next.js 15", body: "Кто уже щупал новую версию? Turbopack реально собирает проект за миллисекунды.", likes: 14, isAnonymous: false, revealLikes: 5 },
  { id: 108, userId: 3, title: "Типографика", body: "Шрифт San Francisco (system-ui) на macOS выглядит просто божественно в этом интерфейсе.", likes: 7, isAnonymous: true, revealLikes: 10 },
  { id: 109, userId: 2, title: "Мотивация", body: "Главное не останавливаться. Каждый новый проект делает вас на шаг ближе к senior уровню.", likes: 42, isAnonymous: false, revealLikes: 5 },
  { id: 110, userId: 1, title: "Тайный баг", body: "Кажется, я случайно оставил console.log() в продакшене... Надеюсь, никто не заметит.", likes: 1, isAnonymous: true, revealLikes: 5 },
];

interface AppContextType {
  posts: Post[];
  users: Record<number, User>;
  currentUser: User;
  theme: 'light' | 'dark';
  setCurrentUser: (user: User) => void;
  toggleTheme: () => void;
  updateUser: (id: number, firstName: string, lastName: string, bio: string) => void;
  addPost: (title: string, body: string, revealLikes: number) => void;
  updatePost: (id: number, title: string, body: string) => void;
  deletePost: (id: number) => void;
  toggleLike: (postId: number) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [users, setUsers] = useState<Record<number, User>>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[1]);
  const [theme, setTheme] = useState<'light'|'dark'>('light');

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Новая функция обновления профиля пользователя
  const updateUser = (id: number, firstName: string, lastName: string, bio: string) => {
    setUsers(prev => ({
      ...prev,
      [id]: { ...prev[id], firstName, lastName, bio }
    }));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, firstName, lastName, bio }));
    }
  };

  const addPost = (title: string, body: string, revealLikes: number) => {
    const newPost: Post = { id: Date.now(), userId: currentUser.id, title, body, likes: 0, isAnonymous: true, revealLikes };
    setPosts([newPost, ...posts]);
  };

  const updatePost = (id: number, title: string, body: string) => setPosts(posts.map(p => p.id === id ? { ...p, title, body } : p));
  const deletePost = (id: number) => setPosts(posts.filter(p => p.id !== id));

  const toggleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newLikes = post.likes + 1;
        const shouldReveal = newLikes >= post.revealLikes;
        return { ...post, likes: newLikes, isAnonymous: post.isAnonymous && !shouldReveal };
      }
      return post;
    }));
  };

  return (
    <AppContext.Provider value={{ 
      posts, users, currentUser, theme, 
      setCurrentUser, toggleTheme, updateUser, addPost, updatePost, deletePost, toggleLike 
    }}>
      {children}
    </AppContext.Provider>
  );
}