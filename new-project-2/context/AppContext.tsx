"use client";
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";

/* ------------------------------ Типы ------------------------------ */

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
  likedBy: number[]; // кто из пользователей поставил лайк
  isAnonymous: boolean;
  revealLikes: number;
  createdAt: number;
  comments: Comment[];
  reports: number[]; // кто пожаловался
}

export type NotificationType = "reveal" | "comment" | "report";

export interface AppNotification {
  id: number;
  userId: number; // получатель
  type: NotificationType;
  postId: number;
  fromUserId?: number;
  createdAt: number;
  read: boolean;
}

export interface ToastItem {
  id: number;
  text: string;
}

export interface RegisterData {
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
}

export type RegisterResult = { ok: true; id: number } | { ok: false; error: string };

/* ---------------------------- Утилиты ----------------------------- */

const MIN = 60_000;
const NOW = Date.now();
let idCounter = 0;
export const nextId = () => Date.now() * 1000 + (idCounter++ % 1000);

// Аватар из DiceBear. scale < 100 уменьшает рисунок внутри холста,
// поэтому голова и плечи не обрезаются круглой маской.
export const makeAvatar = (seed: string, bg: string) =>
  `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&scale=82&backgroundColor=${bg}`;

const AVATAR_COLORS = ["e9d5ff", "bfdbfe", "fde68a", "fbcfe8", "bbf7d0", "c7d2fe", "fecaca", "a7f3d0", "fed7aa", "bae6fd"];

export const avatarFor = (username: string) => {
  let hash = 0;
  for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return makeAvatar(username, AVATAR_COLORS[hash % AVATAR_COLORS.length]);
};

/* --------------------------- Начальные данные --------------------------- */

const MOCK_USERS: Record<number, User> = {
  1: { id: 1, username: "temirlan", firstName: "Темирлан", lastName: "Кулсаринов", image: makeAvatar("temirlan", "e9d5ff"), bio: "Software Engineer / CS Student. Создатель и модератор SecretSpace.", verified: true, role: "moderator" },
  2: { id: 2, username: "dinmukhammad", firstName: "Динмухаммад", lastName: "Дауренбеков", image: makeAvatar("din", "bfdbfe"), bio: "CEO, визионер.", verified: true },
  3: { id: 3, username: "aituar", firstName: "Айтуар", lastName: "Байбурин", image: makeAvatar("aituar", "fde68a"), bio: "Веб-дизайнер." },
  4: { id: 4, username: "aliya.nur", firstName: "Алия", lastName: "Нурланова", image: makeAvatar("aliya", "fbcfe8"), bio: "Контент-мейкер из Астаны. Пишу про бренды и людей за ними.", verified: true },
  5: { id: 5, username: "ruslan_lens", firstName: "Руслан", lastName: "Ахметов", image: makeAvatar("ruslan", "bbf7d0"), bio: "Фотограф. Ловлю свет на набережной Ишима." },
  6: { id: 6, username: "aruzhan.ds", firstName: "Аружан", lastName: "Сейтқызы", image: makeAvatar("aruzhan", "c7d2fe"), bio: "Data Scientist. Обучаю модели и иногда сама учусь у них." },
  7: { id: 7, username: "daniyar.beats", firstName: "Данияр", lastName: "Мусин", image: makeAvatar("daniyar", "fecaca"), bio: "Музыкальный продюсер. Бит важнее слов." },
  8: { id: 8, username: "madina.ux", firstName: "Мадина", lastName: "Оспанова", image: makeAvatar("madina", "a7f3d0"), bio: "UX-исследователь. Если пользователь запутался, виноват интерфейс." },
  9: { id: 9, username: "yerlan.startup", firstName: "Ерлан", lastName: "Бекенов", image: makeAvatar("yerlan", "fed7aa"), bio: "Основатель трёх стартапов, два из них уже закрылись. Работаю над четвёртым.", verified: true },
  10: { id: 10, username: "amina.travel", firstName: "Амина", lastName: "Касымова", image: makeAvatar("amina", "bae6fd"), bio: "Путешественница. 23 страны, ни в одной не нашла лучший плов." },
};

const cm = (id: number, userId: number, text: string, minsAgo: number): Comment => ({
  id,
  userId,
  text,
  createdAt: NOW - minsAgo * MIN,
});

const post = (
  id: number,
  userId: number,
  title: string,
  body: string,
  likes: number,
  isAnonymous: boolean,
  revealLikes: number,
  minsAgo: number,
  comments: Comment[] = [],
  reports: number[] = []
): Post => ({ id, userId, title, body, likes, likedBy: [], isAnonymous, revealLikes, createdAt: NOW - minsAgo * MIN, comments, reports });

const INITIAL_POSTS: Post[] = [
  post(118, 4, "Про дедлайны", "Сдавать работу за час до дедлайна, это не прокрастинация, а управление ожиданиями заказчика.", 2, true, 6, 12),
  post(117, 10, "Лучший плов", "После 23 стран вывод такой: лучший плов всё равно делает мама. Но в Самарканде был очень близок.", 27, false, 5, 45, [
    cm(2008, 9, "Самаркандский плов — это отдельная тема.", 40),
    cm(2009, 5, "Присоединяюсь.", 30),
  ]),
  post(116, 9, "Честно про стартапы", "Из трёх закрытых проектов самый ценный опыт дал самый провальный. Ошибки дорого стоят, зато запоминаются.", 5, true, 7, 95),
  post(115, 8, "Тест на пятерых", "Пять человек из пяти не нашли кнопку «Купить». Дизайнер сказал, что она очень стильная.", 22, false, 5, 180, [
    cm(2006, 3, "Кнопка стильная, но невидимая — это тоже дизайн :)", 170),
  ]),
  post(114, 7, "Новый трек", "Закончил биты для альбома. Один из треков записан на звуках астанинского метро... которого нет.", 9, true, 12, 300),
  post(113, 6, "Признание", "Моя модель на 99% точности оказалась просто запомнила тестовую выборку. Привет, утечка данных.", 3, true, 8, 420, [
    cm(2007, 1, "Классика. Валидацию всегда делаем на отложенной выборке.", 400),
  ]),
  post(112, 5, "Золотой час", "Лучший свет в Астане бывает ровно 20 минут перед закатом. Остальное время просто светло.", 31, false, 5, 600, [
    cm(2004, 10, "Согласна, в Астане закаты особенные.", 580),
    cm(2005, 4, "Нужен репортаж с набережной!", 570),
  ]),
  post(111, 4, "Закулисье съёмок", "Вчера снимали ролик для одного казахстанского бренда. Дубль номер 27, и только тогда получилось.", 18, false, 5, 900),
  post(110, 1, "Тайный баг", "Кажется, я случайно оставил console.log() в продакшене... Надеюсь, никто не заметит.", 1, true, 5, 1300),
  post(109, 2, "Мотивация", "Главное не останавливаться. Каждый новый проект делает вас на шаг ближе к senior уровню.", 42, false, 5, 1700),
  post(108, 3, "Типографика", "Шрифт San Francisco (system-ui) на macOS выглядит просто божественно в этом интерфейсе.", 7, true, 10, 2200),
  post(107, 1, "Next.js 15", "Кто уже щупал новую версию? Turbopack реально собирает проект за миллисекунды.", 14, false, 5, 2900, [
    cm(2003, 6, "Turbopack реально быстрый, подтверждаю.", 2800),
  ]),
  post(106, 2, "Инсайд с планерки", "Завтра анонсируем новую фичу для портфолио. Конкуренты будут плакать.", 4, true, 10, 3500, [], [3, 6]),
  post(105, 3, "Минимализм", "Профили теперь открываются на весь экран. Никаких модалок, только чистый контент.", 8, false, 5, 4300),
  post(104, 1, "Анимации фона", "Оцените задний фон, он реагирует на скролл! Писал логику синхронизации около часа.", 2, true, 5, 5200),
  post(103, 2, "Планы на Q4", "Готовим мобильное приложение на React Native. Скоро покажу первые наброски интерфейса.", 25, false, 10, 6200, [
    cm(2001, 4, "Жду релиз! Покажешь прототип?", 6000),
    cm(2002, 5, "Надеюсь, на React Native будет плавно.", 5900),
  ]),
  post(102, 3, "Секрет дизайнера", "Я спрятал пасхалку в макете. Попробуйте найти, когда этот пост наберет лайки.", 12, true, 15, 7500),
  post(101, 1, "Тёмная тема", "Теперь всё работает в дарк моде. И инста-лайки тоже здесь!", 6, false, 5, 9000),
];

/* ------------------------------ Контекст ------------------------------ */

interface AppContextType {
  ready: boolean;
  posts: Post[];
  users: Record<number, User>;
  currentUser: User;
  isModerator: boolean;
  theme: "light" | "dark";
  profileId: number | null;
  moderationOpen: boolean;
  activePostId: number | null;
  registerOpen: boolean;
  notifications: AppNotification[]; // только для текущего пользователя
  unreadCount: number;
  toasts: ToastItem[];
  switchAccount: (id: number) => void;
  toggleTheme: () => void;
  openProfile: (id: number | null) => void;
  openModeration: () => void;
  openPost: (id: number | null) => void;
  setRegisterOpen: (open: boolean) => void;
  registerUser: (data: RegisterData) => RegisterResult;
  updateUser: (id: number, firstName: string, lastName: string, bio: string) => void;
  addPost: (title: string, body: string, revealLikes: number) => void;
  updatePost: (id: number, title: string, body: string) => void;
  deletePost: (id: number) => void;
  toggleLike: (postId: number) => void;
  addComment: (postId: number, text: string) => void;
  deleteComment: (postId: number, commentId: number) => void;
  reportPost: (postId: number) => void;
  dismissReports: (postId: number) => void;
  markNotificationsRead: (id?: number) => void;
  pushToast: (text: string) => void;
  resetData: () => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

const STORAGE_KEY = "secretspace-v3";
const THEME_KEY = "secretspace-theme";

interface SavedState {
  posts?: Partial<Post>[];
  users?: Record<string, Partial<User>>;
  currentUserId?: number;
  notifications?: AppNotification[];
}

const parseRoute = (hash: string) => decodeURIComponent(hash.replace(/^#\/?/, ""));

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [users, setUsers] = useState<Record<number, User>>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = useState<number>(1);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [route, setRoute] = useState("");
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [ready, setReady] = useState(false);

  // Актуальные значения для действий, у которых есть побочные эффекты
  const postsRef = useRef(posts);
  const usersRef = useRef(users);
  postsRef.current = posts;
  usersRef.current = users;

  /* ---------- Загрузка сохранённых данных ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedState;

        // Пользователи: роль, аватар и верификация встроенных аккаунтов берутся из кода,
        // из хранилища только имя, фамилия и био. Созданные аккаунты восстанавливаются целиком.
        const merged: Record<number, User> = { ...MOCK_USERS };
        for (const [key, su] of Object.entries(saved.users ?? {})) {
          const id = Number(key);
          if (MOCK_USERS[id]) {
            merged[id] = {
              ...MOCK_USERS[id],
              firstName: su.firstName ?? MOCK_USERS[id].firstName,
              lastName: su.lastName ?? MOCK_USERS[id].lastName,
              bio: su.bio ?? MOCK_USERS[id].bio,
            };
          } else if (su.username && su.firstName && su.lastName) {
            merged[id] = {
              id,
              username: su.username,
              firstName: su.firstName,
              lastName: su.lastName,
              bio: su.bio ?? "",
              image: avatarFor(su.username),
            };
          }
        }
        setUsers(merged);

        if (Array.isArray(saved.posts)) {
          const restored = saved.posts
            .filter((p): p is Partial<Post> & { id: number; userId: number } =>
              typeof p.id === "number" && typeof p.userId === "number" && !!merged[p.userId]
            )
            .map(
              (p): Post => ({
                id: p.id,
                userId: p.userId,
                title: p.title ?? "",
                body: p.body ?? "",
                likes: p.likes ?? 0,
                likedBy: Array.isArray(p.likedBy) ? p.likedBy : [],
                isAnonymous: p.isAnonymous ?? true,
                revealLikes: p.revealLikes ?? 5,
                createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
                comments: Array.isArray(p.comments) ? p.comments.filter((c) => !!merged[c.userId]) : [],
                reports: Array.isArray(p.reports) ? p.reports : [],
              })
            );
          setPosts(restored);
        }
        if (typeof saved.currentUserId === "number" && merged[saved.currentUserId]) {
          setCurrentUserId(saved.currentUserId);
        }
        if (Array.isArray(saved.notifications)) setNotifications(saved.notifications);
      }

      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
    } catch {
      // повреждённые данные игнорируем, остаются значения по умолчанию
    }
    setRoute(parseRoute(window.location.hash));
    setReady(true);
  }, []);

  /* ---------- Сохранение ---------- */
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ posts, users, currentUserId, notifications }));
    } catch {
      // хранилище переполнено или недоступно
    }
  }, [posts, users, currentUserId, notifications, ready]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (!ready) return;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme, ready]);

  /* ---------- Навигация (через hash, работает кнопка «Назад») ---------- */
  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, []);

  const firstRoute = useRef(true);
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
  }, [route]);

  const navigate = useCallback((r: string) => {
    if (r) {
      window.location.hash = r;
    } else if (window.location.hash) {
      window.history.pushState(null, "", window.location.pathname + window.location.search);
    }
    setRoute(r);
  }, []);

  const openProfile = useCallback(
    (id: number | null) => {
      const u = id !== null ? usersRef.current[id] : null;
      navigate(u ? `u-${u.username}` : "");
    },
    [navigate]
  );
  const openModeration = useCallback(() => navigate("moderation"), [navigate]);
  const openPost = useCallback((id: number | null) => setActivePostId(id), []);

  const profileId = useMemo(() => {
    if (!route.startsWith("u-")) return null;
    const name = route.slice(2).toLowerCase();
    return Object.values(users).find((u) => u.username.toLowerCase() === name)?.id ?? null;
  }, [route, users]);
  const moderationOpen = route === "moderation";

  /* ---------- Текущий пользователь ---------- */
  const currentUser = users[currentUserId] ?? users[1];
  const isModerator = currentUser.role === "moderator";

  /* ---------- Тосты и уведомления ---------- */
  const pushToast = useCallback((text: string) => {
    const id = nextId();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600);
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    setNotifications((prev) => [{ ...n, id: nextId(), createdAt: Date.now(), read: false }, ...prev].slice(0, 100));
  }, []);

  const myNotifications = useMemo(
    () => notifications.filter((n) => n.userId === currentUserId && posts.some((p) => p.id === n.postId)),
    [notifications, currentUserId, posts]
  );
  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const markNotificationsRead = useCallback(
    (id?: number) => {
      setNotifications((prev) =>
        prev.map((n) => (n.userId === currentUserId && (id === undefined || n.id === id) ? { ...n, read: true } : n))
      );
    },
    [currentUserId]
  );

  /* ---------- Аккаунты ---------- */
  const switchAccount = useCallback((id: number) => setCurrentUserId(id), []);
  const toggleTheme = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), []);

  const updateUser = useCallback((id: number, firstName: string, lastName: string, bio: string) => {
    setUsers((prev) => ({ ...prev, [id]: { ...prev[id], firstName, lastName, bio } }));
  }, []);

  const registerUser = useCallback(
    (data: RegisterData): RegisterResult => {
      const username = data.username.trim().toLowerCase();
      const firstName = data.firstName.trim();
      const lastName = data.lastName.trim();
      if (!firstName || !lastName) return { ok: false, error: "Укажите имя и фамилию." };
      if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
        return { ok: false, error: "Имя пользователя: от 3 до 20 символов, латиница, цифры, _ и точка." };
      }
      if (Object.values(usersRef.current).some((u) => u.username.toLowerCase() === username)) {
        return { ok: false, error: "Это имя пользователя уже занято." };
      }
      const id = Math.max(...Object.keys(usersRef.current).map(Number)) + 1;
      const user: User = { id, username, firstName, lastName, bio: data.bio.trim(), image: avatarFor(username) };
      setUsers((prev) => ({ ...prev, [id]: user }));
      setCurrentUserId(id);
      pushToast(`Аккаунт @${username} создан`);
      return { ok: true, id };
    },
    [pushToast]
  );

  /* ---------- Посты ---------- */
  const addPost = useCallback(
    (title: string, body: string, revealLikes: number) => {
      const newPost: Post = {
        id: nextId(),
        userId: currentUserId,
        title,
        body,
        likes: 0,
        likedBy: [],
        isAnonymous: true,
        revealLikes,
        createdAt: Date.now(),
        comments: [],
        reports: [],
      };
      setPosts((prev) => [newPost, ...prev]);
      pushToast(`Пост опубликован анонимно. Автор раскроется после ${revealLikes} лайков`);
    },
    [currentUserId, pushToast]
  );

  const updatePost = useCallback(
    (id: number, title: string, body: string) => {
      setPosts((prev) => prev.map((p) => (p.id === id && p.userId === currentUserId ? { ...p, title, body } : p)));
      pushToast("Изменения сохранены");
    },
    [currentUserId, pushToast]
  );

  // Удалить пост может его автор или модератор
  const deletePost = useCallback(
    (id: number) => {
      setPosts((prev) => prev.filter((p) => p.id !== id || !(p.userId === currentUserId || isModerator)));
      setActivePostId((prev) => (prev === id ? null : prev));
      pushToast("Пост удалён");
    },
    [currentUserId, isModerator, pushToast]
  );

  // Лайк можно поставить и снять. Автор не может лайкать свой пост,
  // иначе он сам раскрывал бы свою анонимность.
  const toggleLike = useCallback(
    (postId: number) => {
      const target = postsRef.current.find((p) => p.id === postId);
      if (!target || target.userId === currentUserId) return;
      const liked = target.likedBy.includes(currentUserId);
      const reveals = !liked && target.isAnonymous && target.likes + 1 >= target.revealLikes;

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            likes: liked ? Math.max(0, p.likes - 1) : p.likes + 1,
            likedBy: liked ? p.likedBy.filter((id) => id !== currentUserId) : [...p.likedBy, currentUserId],
            // раскрытый пост уже не станет анонимным снова
            isAnonymous: reveals ? false : p.isAnonymous,
          };
        })
      );

      if (reveals) {
        addNotification({ userId: target.userId, type: "reveal", postId });
        pushToast(`Пост раскрыт! Автор: @${usersRef.current[target.userId]?.username}`);
      }
    },
    [currentUserId, addNotification, pushToast]
  );

  /* ---------- Комментарии ---------- */
  const addComment = useCallback(
    (postId: number, text: string) => {
      const clean = text.trim().slice(0, 300);
      if (!clean) return;
      const target = postsRef.current.find((p) => p.id === postId);
      if (!target) return;
      const comment: Comment = { id: nextId(), userId: currentUserId, text: clean, createdAt: Date.now() };
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)));
      if (target.userId !== currentUserId) {
        addNotification({ userId: target.userId, type: "comment", postId, fromUserId: currentUserId });
      }
    },
    [currentUserId, addNotification]
  );

  // Удалить комментарий может его автор или модератор
  const deleteComment = useCallback(
    (postId: number, commentId: number) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: p.comments.filter((c) => c.id !== commentId || !(c.userId === currentUserId || isModerator)) }
            : p
        )
      );
    },
    [currentUserId, isModerator]
  );

  /* ---------- Жалобы ---------- */
  const reportPost = useCallback(
    (postId: number) => {
      const target = postsRef.current.find((p) => p.id === postId);
      if (!target || target.userId === currentUserId || target.reports.includes(currentUserId)) return;
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reports: [...p.reports, currentUserId] } : p)));
      Object.values(usersRef.current)
        .filter((u) => u.role === "moderator" && u.id !== currentUserId)
        .forEach((m) => addNotification({ userId: m.id, type: "report", postId, fromUserId: currentUserId }));
      pushToast("Жалоба отправлена модератору");
    },
    [currentUserId, addNotification, pushToast]
  );

  const dismissReports = useCallback(
    (postId: number) => {
      if (!isModerator) return;
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reports: [] } : p)));
      pushToast("Жалобы отклонены");
    },
    [isModerator, pushToast]
  );

  /* ---------- Сброс демо-данных ---------- */
  const resetData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    window.location.hash = "";
    window.location.reload();
  }, []);

  const value = useMemo<AppContextType>(
    () => ({
      ready, posts, users, currentUser, isModerator, theme, profileId, moderationOpen, activePostId, registerOpen,
      notifications: myNotifications, unreadCount, toasts,
      switchAccount, toggleTheme, openProfile, openModeration, openPost, setRegisterOpen, registerUser, updateUser,
      addPost, updatePost, deletePost, toggleLike, addComment, deleteComment, reportPost, dismissReports,
      markNotificationsRead, pushToast, resetData,
    }),
    [
      ready, posts, users, currentUser, isModerator, theme, profileId, moderationOpen, activePostId, registerOpen,
      myNotifications, unreadCount, toasts,
      switchAccount, toggleTheme, openProfile, openModeration, openPost, registerUser, updateUser,
      addPost, updatePost, deletePost, toggleLike, addComment, deleteComment, reportPost, dismissReports,
      markNotificationsRead, pushToast, resetData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
