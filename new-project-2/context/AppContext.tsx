"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string;
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

interface AppContextType {
  posts: Post[];
  users: Record<number, User>;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  addPost: (title: string, body: string) => void;
  toggleLike: (postId: number) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<Record<number, User>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const usersRes = await fetch("https://dummyjson.com/users?limit=5");
        const usersData = await usersRes.json();
        const usersMap: Record<number, User> = {};
        usersData.users.forEach((u: User) => (usersMap[u.id] = u));
        
        setUsers(usersMap);
        setCurrentUser(usersData.users[0]);

        const postsRes = await fetch("https://dummyjson.com/posts?limit=5");
        const postsData = await postsRes.json();
        
        const formattedPosts: Post[] = postsData.posts.map((p: any) => ({
          id: p.id,
          userId: p.userId,
          title: p.title,
          body: p.body,
          likes: p.reactions?.likes || 0,
          isAnonymous: false, // Старые посты подгружаются раскрытыми
          revealLikes: 5,
        }));
        setPosts(formattedPosts);
      } catch (e) {
        console.error("Ошибка загрузки данных:", e);
      }
    }
    fetchData();
  }, []);

  const addPost = (title: string, body: string) => {
    if (!currentUser) return;
    const newPost: Post = {
      id: Date.now(),
      userId: currentUser.id,
      title: title,
      body: body,
      likes: 0,
      isAnonymous: true, // Новый пост создаётся анонимным!
      revealLikes: 5,     // Раскрывается после 5 лайков
    };
    setPosts([newPost, ...posts]);
  };

  const toggleLike = (postId: number) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const newLikes = post.likes + 1;
          const shouldReveal = newLikes >= post.revealLikes;
          return {
            ...post,
            likes: newLikes,
            isAnonymous: post.isAnonymous && !shouldReveal,
          };
        }
        return post;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{ posts, users, currentUser, setCurrentUser, addPost, toggleLike }}
    >
      {children}
    </AppContext.Provider>
  );
}