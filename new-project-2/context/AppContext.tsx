"use client";
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string;
  bio: string;
  verified?: boolean;
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
  likes: number;
  likedBy: number[]; // id пользователей, которые поставили лайк в этой сессии
  isAnonymous: boolean;
  revealLikes: number;
}

// Аватар из DiceBear. scale < 100 уменьшает рисунок внутри холста,
// поэтому плечи и голова больше не обрезаются круглой маской.
const avatar = (seed: string, bg: string) =>
  `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&scale=82&backgroundColor=${bg}`;

const MOCK_USERS: Record<number, User> = {
  1: { id: 1, username: "temirlan", firstName: "Темирлан", lastName: "Кулсаринов", image: avatar("temirlan", "e9d5ff"), bio: "Software Engineer / CS Student. Создатель.", verified: true },
  2: { id: 2, username: "dinmukhammad", firstName: "Динмухаммад", lastName: "Дауренбеков", image: avatar("din", "bfdbfe"), bio: "CEO, визионер.", verified: true },
  3: { id: 3, username: "aituar", firstName: "Айтуар", lastName: "Байбурин", image: avatar("aituar", "fde68a"), bio: "Веб-дизайнер." },
  4: { id: 4, username: "aliya.nur", firstName: "Алия", lastName: "Нурланова", image: avatar("aliya", "fbcfe8"), bio: "Контент-мейкер из Астаны. Пишу про бренды и людей за ними.", verified: true },
  5: { id: 5, username: "ruslan_lens", firstName: "Руслан", lastName: "Ахметов", image: avatar("ruslan", "bbf7d0"), bio: "Фотограф. Ловлю свет на набережной Ишима." },
  6: { id: 6, username: "aruzhan.ds", firstName: "Аружан", lastName: "Сейтқызы", image: avatar("aruzhan", "c7d2fe"), bio: "Data Scientist. Обучаю модели и иногда сама учусь у них." },
  7: { id: 7, username: "daniyar.beats", firstName: "Данияр", lastName: "Мусин", image: avatar("daniyar", "fecaca"), bio: "Музыкальный продюсер. Бит важнее слов." },
  8: { id: 8, username: "madina.ux", firstName: "Мадина", lastName: "Оспанова", image: avatar("madina", "a7f3d0"), bio: "UX-исследователь. Если пользователь запутался, виноват интерфейс." },
  9: { id: 9, username: "yerlan.startup", firstName: "Ерлан", lastName: "Бекенов", image: avatar("yerlan", "fed7aa"), bio: "Основатель трёх стартапов, два из них уже закрылись. Работаю над четвёртым.", verified: true },
  10: { id: 10, username: "amina.travel", firstName: "Амина", lastName: "Касымова", image: avatar("amina", "bae6fd"), bio: "Путешественница. 23 страны, ни в одной не нашла лучший плов." },
};

const post = (
  id: number,
  userId: number,
  title: string,
  body: string,
  likes: number,
  isAnonymous: boolean,
  revealLikes: number
): Post => ({ id, userId, title, body, likes, likedBy: [], isAnonymous, revealLikes });

const INITIAL_POSTS: Post[] = [
  post(101, 1, "Тёмная тема", "Теперь всё работает в дарк моде. И инста-лайки тоже здесь!", 6, false, 5),
  post(102, 3, "Секрет дизайнера", "Я спрятал пасхалку в макете. Попробуйте найти, когда этот пост наберет лайки.", 12, true, 15),
  post(103, 2, "Планы на Q4", "Готовим мобильное приложение на React Native. Скоро покажу первые наброски интерфейса.", 25, false, 10),
  post(104, 1, "Анимации фона", "Оцените задний фон, он реагирует на скролл! Писал логику синхронизации около часа.", 2, true, 5),
  post(105, 3, "Минимализм", "Профили теперь открываются на весь экран. Никаких модалок, только чистый контент.", 8, false, 5),
  post(106, 2, "Инсайд с планерки", "Завтра анонсируем новую фичу для портфолио. Конкуренты будут плакать.", 4, true, 10),
  post(107, 1, "Next.js 15", "Кто уже щупал новую версию? Turbopack реально собирает проект за миллисекунды.", 14, false, 5),
  post(108, 3, "Типографика", "Шрифт San Francisco (system-ui) на macOS выглядит просто божественно в этом интерфейсе.", 7, true, 10),
  post(109, 2, "Мотивация", "Главное не останавливаться. Каждый новый проект делает вас на шаг ближе к senior уровню.", 42, false, 5),
  post(110, 1, "Тайный баг", "Кажется, я случайно оставил console.log() в продакшене... Надеюсь, никто не заметит.", 1, true, 5),
  post(111, 4, "Закулисье съёмок", "Вчера снимали ролик для одного казахстанского бренда. Дубль номер 27, и только тогда получилось.", 18, false, 5),
  post(112, 5, "Золотой час", "Лучший свет в Астане бывает ровно 20 минут перед закатом. Остальное время просто светло.", 31, false, 5),
  post(113, 6, "Признание", "Моя модель на 99% точности оказалась просто запомнила тестовую выборку. Привет, утечка данных.", 3, true, 8),
  post(114, 7, "Новый трек", "Закончил биты для альбома. Один из треков записан на звуках астанинского метро... которого нет.", 9, true, 12),
  post(115, 8, "Тест на пятерых", "Пять человек из пяти не нашли кнопку «Купить». Дизайнер сказал, что она очень стильная.", 22, false, 5),
  post(116, 9, "Честно про стартапы", "Из трёх закрытых проектов самый ценный опыт дал самый провальный. Ошибки дорого стоят, зато запоминаются.", 5, true, 7),
  post(117, 10, "Лучший плов", "После 23 стран вывод такой: лучший плов всё равно делает мама. Но в Самарканде был очень близок.", 27, false, 5),
  post(118, 4, "Про дедлайны", "Сдавать работу за час до дедлайна, это не прокрастинация, а управление ожиданиями заказчика.", 2, true, 6),
];

interface AppContextType {
  posts: Post[];
  users: Record<number, User>;
  currentUser: User;
  theme: "light" | "dark";
  profileId: number | null;
  switchAccount: (id: number) => void;
  toggleTheme: () => void;
  openProfile: (id: number | null) => void;
  updateUser: (id: number, firstName: string, lastName: string, bio: string) => void;
  addPost: (title: string, body: string, revealLikes: number) => void;
  updatePost: (id: number, title: string, body: string) => void;
  deletePost: (id: number) => void;
  toggleLike: (postId: number) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

const STORAGE_KEY = "secretspace-v2";
const THEME_KEY = "secretspace-theme";

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [users, setUsers] = useState<Record<number, User>>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = useState<number>(1);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profileId, setProfileId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Загрузка сохранённых данных (только в браузере, после монтирования)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.posts)) setPosts(saved.posts);
        if (saved.users) setUsers({ ...MOCK_USERS, ...saved.users });
        if (typeof saved.currentUserId === "number") setCurrentUserId(saved.currentUserId);
      }
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    } catch {
      // повреждённые данные игнорируем, остаются значения по умолчанию
    }
    setHydrated(true);
  }, []);

  // Сохранение
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ posts, users, currentUserId }));
    } catch {
      // хранилище переполнено или недоступно
    }
  }, [posts, users, currentUserId, hydrated]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (!hydrated) return;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme, hydrated]);

  const currentUser = users[currentUserId] ?? users[1];

  const toggleTheme = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), []);

  const switchAccount = useCallback((id: number) => {
    setCurrentUserId(id);
  }, []);

  const openProfile = useCallback((id: number | null) => {
    setProfileId(id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const updateUser = useCallback((id: number, firstName: string, lastName: string, bio: string) => {
    setUsers((prev) => ({ ...prev, [id]: { ...prev[id], firstName, lastName, bio } }));
  }, []);

  const addPost = useCallback(
    (title: string, body: string, revealLikes: number) => {
      const newPost: Post = {
        id: Date.now(),
        userId: currentUserId,
        title,
        body,
        likes: 0,
        likedBy: [],
        isAnonymous: true,
        revealLikes,
      };
      setPosts((prev) => [newPost, ...prev]);
    },
    [currentUserId]
  );

  const updatePost = useCallback((id: number, title: string, body: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, title, body } : p)));
  }, []);

  const deletePost = useCallback((id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Лайк можно поставить и снять. Автор не может лайкать свой пост,
  // иначе он сам бы раскрывал свою анонимность.
  const toggleLike = useCallback(
    (postId: number) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId || p.userId === currentUserId) return p;
          const alreadyLiked = p.likedBy.includes(currentUserId);
          if (alreadyLiked) {
            return { ...p, likes: Math.max(0, p.likes - 1), likedBy: p.likedBy.filter((id) => id !== currentUserId) };
          }
          const likes = p.likes + 1;
          return {
            ...p,
            likes,
            likedBy: [...p.likedBy, currentUserId],
            // раскрытый пост уже не станет анонимным снова
            isAnonymous: p.isAnonymous && likes < p.revealLikes,
          };
        })
      );
    },
    [currentUserId]
  );

  const value = useMemo(
    () => ({
      posts, users, currentUser, theme, profileId,
      switchAccount, toggleTheme, openProfile, updateUser, addPost, updatePost, deletePost, toggleLike,
    }),
    [posts, users, currentUser, theme, profileId, switchAccount, toggleTheme, openProfile, updateUser, addPost, updatePost, deletePost, toggleLike]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
