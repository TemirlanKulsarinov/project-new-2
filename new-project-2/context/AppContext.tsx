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
import { clearMediaFiles, deleteMediaFiles } from "@/lib/mediaStore";
import type { PostMedia } from "@/lib/mediaStore";

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

export interface Report {
  userId: number;
  reason: string;
  createdAt: number;
}

export interface Comment {
  id: number;
  userId: number;
  text: string;
  createdAt: number;
  reports: Report[];
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
  reports: Report[];
  media: PostMedia[];
  repostedBy: number[];
}

export type NotificationType = "reveal" | "comment" | "report";

export interface AppNotification {
  id: number;
  userId: number; // получатель
  type: NotificationType;
  postId: number;
  commentId?: number;
  fromUserId?: number;
  createdAt: number;
  read: boolean;
}

export interface ChatMessage {
  id: number;
  fromUserId: number;
  toUserId: number;
  text: string;
  createdAt: number;
}

export interface AccountReport {
  reporterId: number;
  targetUserId: number;
  reason: string;
  createdAt: number;
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

export type RegisterResult = { ok: true; id: number; username: string } | { ok: false; error: string };

export const REPORT_REASONS = [
  "Спам или реклама",
  "Оскорбления и травля",
  "Раскрытие личных данных",
  "Недопустимый контент",
  "Другое",
];

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

const rep = (userId: number, reason: string, minsAgo: number): Report => ({
  userId,
  reason,
  createdAt: NOW - minsAgo * MIN,
});

const cm = (id: number, userId: number, text: string, minsAgo: number, reports: Report[] = []): Comment => ({
  id,
  userId,
  text,
  createdAt: NOW - minsAgo * MIN,
  reports,
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
  reports: Report[] = []
): Post => ({
  id, userId, title, body, likes, likedBy: [], isAnonymous, revealLikes,
  createdAt: NOW - minsAgo * MIN, comments, reports, media: [], repostedBy: [],
});

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
  post(109, 2, "Мотивация", "Главное не останавливаться. Каждый новый проект делает вас на шаг ближе к senior уровню.", 42, false, 5, 1700, [
    cm(2010, 9, "Купите мой курс по senior-уровню всего за 49 999 ₸! Пишите в личку.", 1650, [
      rep(2, "Спам или реклама", 1600),
      rep(3, "Спам или реклама", 1500),
    ]),
  ]),
  post(108, 3, "Типографика", "Шрифт San Francisco (system-ui) на macOS выглядит просто божественно в этом интерфейсе.", 7, true, 10, 2200),
  post(107, 1, "Next.js 15", "Кто уже щупал новую версию? Turbopack реально собирает проект за миллисекунды.", 14, false, 5, 2900, [
    cm(2003, 6, "Turbopack реально быстрый, подтверждаю.", 2800),
  ]),
  post(106, 2, "Инсайд с планерки", "Завтра анонсируем новую фичу для портфолио. Конкуренты будут плакать.", 4, true, 10, 3500, [], [
    rep(3, "Раскрытие личных данных", 3400),
    rep(6, "Другое", 3300),
  ]),
  post(105, 3, "Минимализм", "Профили теперь открываются на весь экран. Никаких модалок, только чистый контент.", 8, false, 5, 4300),
  post(104, 1, "Анимации фона", "Оцените задний фон, он реагирует на скролл! Писал логику синхронизации около часа.", 2, true, 5, 5200),
  post(103, 2, "Планы на Q4", "Готовим мобильное приложение на React Native. Скоро покажу первые наброски интерфейса.", 25, false, 10, 6200, [
    cm(2001, 4, "Жду релиз! Покажешь прототип?", 6000),
    cm(2002, 5, "Надеюсь, на React Native будет плавно.", 5900),
  ]),
  post(102, 3, "Секрет дизайнера", "Я спрятал пасхалку в макете. Попробуйте найти, когда этот пост наберет лайки.", 12, true, 15, 7500),
  post(101, 1, "Тёмная тема", "Теперь всё работает в дарк моде. И инста-лайки тоже здесь!", 6, false, 5, 9000),
  post(100, 8, "Тихий час", "Выключила уведомления на вечер и впервые за неделю дочитала книгу до конца.", 2, true, 6, 25),
  post(99, 4, "Маленькая мастерская", "Сегодня собрали первую версию сайта для локального бренда. Пока просто, зато всё настоящее.", 16, false, 5, 47, [
    cm(3001, 10, "Покажешь, когда запустите?", 30),
    cm(3002, 3, "Очень люблю такие проекты.", 22),
  ]),
  post(98, 7, "Звук дождя", "Записал дождь по дороге домой и уже час пытаюсь превратить его в нормальный сэмпл.", 4, true, 10, 75),
  post(97, 5, "Без фильтров", "Вчерашняя прогулка без камеры напомнила, почему я вообще начал фотографировать.", 38, false, 5, 110, [
    cm(3003, 4, "Иногда лучший кадр остаётся в памяти.", 80),
  ]),
  post(96, 6, "Странная ошибка", "Модель идеально работала на моём ноутбуке, пока я не проверил её на других данных.", 3, true, 8, 145),
  post(95, 10, "Билет в один конец", "Купила билет в Алматы на выходные. План пока состоит из кофе, прогулки и никаких планов.", 54, false, 5, 185, [
    cm(3004, 5, "Загляни на Кок-Тобе, если будет время.", 140),
    cm(3005, 2, "Лучший способ провести выходные.", 125),
  ]),
  post(94, 9, "Первый провал", "Презентация не прошла, зато после неё я наконец понял, кому наш продукт действительно нужен.", 7, true, 12, 230),
  post(93, 3, "Пиксель за пикселем", "Перерисовал старый экран приложения. Удивительно, сколько проблем решает нормальный отступ.", 19, false, 5, 280, [
    cm(3006, 8, "Отступы — тихие герои интерфейса.", 250),
  ]),
  post(92, 1, "Неловкий созвон", "Начал демонстрацию экрана и первые две минуты показывал не тот монитор. Зато все познакомились с моими вкладками.", 1, true, 6, 340),
  post(91, 2, "Короткая прогулка", "Вышел пройтись между встречами, вернулся с новой идеей и без ощущения, что весь день просидел за столом.", 64, false, 5, 410, [
    cm(3007, 6, "Лучший способ перезагрузить голову.", 360),
    cm(3008, 9, "Надо тоже поставить прогулки в календарь.", 320),
  ]),
  post(90, 8, "Проверка на понятность", "Попросила друга впервые открыть прототип. Он нажал на декоративную иллюстрацию и спросил, почему она не кликается.", 4, true, 9, 490),
  post(89, 7, "Репетиция", "Сегодня сыграли новый трек вживую впервые. Один переход развалился, но зал всё равно подпевал.", 29, false, 5, 580),
  post(88, 10, "Список мест", "Составила список мест в городе, куда всё собираюсь сходить. В списке уже 27 пунктов и ни одного свободного дня.", 5, true, 14, 690),
  post(87, 5, "После заката", "На набережной сегодня было почти пусто. Получились самые спокойные кадры за весь месяц.", 47, false, 5, 810, [
    cm(3009, 10, "Там особенно красиво после дождя.", 740),
  ]),
  post(86, 2, "Совет, который сработал", "Перестал начинать день с почты и наконец закончил задачу, которая лежала в списке две недели.", 2, true, 7, 950),
  post(85, 4, "Чайная пауза", "Вместо ещё одного созвона собрали команду на чай. За двадцать минут решили больше, чем за час переписки.", 33, false, 5, 1120),
  post(84, 6, "Цена красивой метрики", "Убрала одну метрику из отчёта, и обсуждение стало вдвое полезнее. Не всё, что можно измерить, важно.", 9, true, 15, 1320, [
    cm(3010, 1, "Сильная мысль, особенно для продуктовых команд.", 1200),
  ]),
  post(83, 9, "План на месяц", "На этот раз в план попали не только дедлайны, но и выходные. Посмотрим, получится ли не передвинуть их.", 72, false, 5, 1560),
  post(82, 3, "Критика макета", "Попросил честный отзыв и получил ровно его. Немного неприятно, зато теперь понятно, что делать дальше.", 3, true, 8, 1840),
  post(81, 1, "Три часа на одну кнопку", "Три часа спорили о тексте на кнопке. Победил вариант, который был в первом черновике.", 21, false, 5, 2200, [
    cm(3011, 8, "Главное, что нашли правильный путь обратно.", 2100),
    cm(3012, 7, "Знакомая история.", 2050),
  ]),
  post(80, 10, "Не тот поезд", "Села не на тот поезд, зато нашла маленькую кофейню, которую теперь буду советовать всем.", 8, true, 12, 2700),
  post(79, 5, "Туманное утро", "Вышел на съёмку затемно, а город встретил таким туманом, что пришлось менять весь план.", 58, false, 5, 3300),
  post(78, 6, "Починил не то", "Потратил вечер на оптимизацию медленной функции. Оказалось, тормозил один лишний запрос к базе.", 1, true, 6, 4100),
  post(77, 7, "Новая демка", "Записал короткую демку на телефон. Качество ужасное, но в ней есть то настроение, которое я искал.", 41, false, 5, 5200, [
    cm(3013, 3, "Сырая демка часто честнее финальной версии.", 5000),
  ]),
  post(76, 8, "Один вопрос на интервью", "Спросили не про самый сильный кейс, а про решение, которое я бы сейчас переделала. Ответ оказался проще.", 4, true, 11, 6800),
  post(75, 4, "Город просыпается", "Утром прошлась пешком до работы вместо такси. У города совсем другой ритм, когда не смотришь на него из окна.", 83, false, 5, 9100),
  post(74, 2, "Команда и доверие", "Самая быстрая задача за месяц — та, где все заранее договорились, кто за что отвечает.", 7, true, 15, 12500),
  post(73, 9, "Письмо себе", "Нашёл заметку годичной давности с планом на этот проект. Почти ничего не совпало, но почему-то это хорошая новость.", 36, false, 5, 18000),
  post(72, 10, "Потерянный маршрут", "Убрала карту в карман и пошла куда глаза глядят. Нашла парк, про который не знала, хотя живу здесь несколько лет.", 2, true, 9, 25500),
  post(71, 3, "Старый скетчбук", "Перелистывал старые наброски и нашёл идею, которую тогда счёл слишком простой. Кажется, пора к ней вернуться.", 97, false, 5, 36000, [
    cm(3014, 4, "Иногда старые идеи просто ждут своего времени.", 34000),
  ]),
];

const SAMPLE_POSTS_VERSION = 1;

/* ------------------------------ Контекст ------------------------------ */

interface AppContextType {
  ready: boolean;
  posts: Post[];
  users: Record<number, User>;
  currentUser: User;
  isModerator: boolean;
  theme: "light" | "dark";
  savedIds: number[]; // сохранённые посты текущего пользователя (новые первыми)
  followingIds: number[];
  followerCounts: Record<number, number>;
  blockedUserIds: number[];
  blockedByUserIds: number[];
  messages: ChatMessage[];
  accountReports: AccountReport[];
  notifications: AppNotification[]; // только для текущего пользователя
  unreadCount: number;
  toasts: ToastItem[];
  switchAccount: (id: number) => void;
  toggleTheme: () => void;
  registerUser: (data: RegisterData) => RegisterResult;
  updateUser: (id: number, firstName: string, lastName: string, bio: string) => void;
  addPost: (title: string, body: string, revealLikes: number, media?: PostMedia[]) => number;
  deletePost: (id: number) => void;
  toggleLike: (postId: number) => void;
  toggleRepost: (postId: number) => void;
  toggleBookmark: (postId: number) => void;
  toggleFollow: (userId: number) => void;
  blockUser: (userId: number) => void;
  unblockUser: (userId: number) => void;
  reportUser: (userId: number, reason: string) => void;
  dismissAccountReports: (userId: number) => void;
  sendMessage: (userId: number, text: string) => boolean;
  addComment: (postId: number, text: string) => void;
  deleteComment: (postId: number, commentId: number) => void;
  reportPost: (postId: number, reason: string) => void;
  reportComment: (postId: number, commentId: number, reason: string) => void;
  dismissReports: (postId: number) => void;
  dismissCommentReports: (postId: number, commentId: number) => void;
  markNotificationsRead: (id?: number) => void;
  pushToast: (text: string) => void;
  resetData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

// Ключи localStorage. Всё состояние сайта лежит в STORAGE_KEY, остальное это настройки интерфейса.
export const STORAGE_KEY = "secretspace-v4";
const OLD_STORAGE_KEY = "secretspace-v3"; // прежняя версия данных, подхватывается автоматически
const THEME_KEY = "secretspace-theme";
export const FEED_PREFS_KEY = "secretspace-feed";
export const DRAFT_KEY = "secretspace-draft";
export const INTRO_KEY = "secretspace-intro";

interface SavedState {
  samplePostsVersion?: number;
  posts?: Partial<Post>[];
  users?: Record<string, Partial<User>>;
  currentUserId?: number;
  notifications?: AppNotification[];
  bookmarks?: Record<string, number[]>;
  following?: Record<string, number[]>;
  blockedUsers?: Record<string, number[]>;
  messages?: ChatMessage[];
  accountReports?: AccountReport[];
}

// Жалобы в старом формате были просто списком id
const normalizeReports = (value: unknown): Report[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((r): Report | null => {
      if (typeof r === "number") return { userId: r, reason: "Не указана", createdAt: Date.now() };
      if (r && typeof r === "object" && typeof (r as Report).userId === "number") {
        const x = r as Partial<Report> & { userId: number };
        return { userId: x.userId, reason: x.reason ?? "Не указана", createdAt: x.createdAt ?? Date.now() };
      }
      return null;
    })
    .filter((r): r is Report => r !== null);
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [users, setUsers] = useState<Record<number, User>>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = useState<number>(1);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [bookmarks, setBookmarks] = useState<Record<number, number[]>>({});
  const [following, setFollowing] = useState<Record<number, number[]>>({});
  const [blockedUsers, setBlockedUsers] = useState<Record<number, number[]>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [accountReports, setAccountReports] = useState<AccountReport[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [ready, setReady] = useState(false);

  // Актуальные значения для действий, у которых есть побочные эффекты
  const postsRef = useRef(posts);
  const usersRef = useRef(users);
  const bookmarksRef = useRef(bookmarks);
  postsRef.current = posts;
  usersRef.current = users;
  bookmarksRef.current = bookmarks;

  /* ---------- Загрузка сохранённых данных ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(OLD_STORAGE_KEY);
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
                comments: Array.isArray(p.comments)
                  ? p.comments
                      .filter((c) => !!merged[c.userId])
                      .map((c) => ({ ...c, reports: normalizeReports((c as Partial<Comment>).reports) }))
                  : [],
                reports: normalizeReports(p.reports),
                media: Array.isArray(p.media)
                  ? p.media.filter((item): item is PostMedia =>
                      !!item &&
                      typeof item.id === "string" &&
                      typeof item.name === "string" &&
                      typeof item.mimeType === "string" &&
                      typeof item.size === "number" &&
                      (item.kind === "image" || item.kind === "video" || item.kind === "audio")
                    )
                  : [],
                repostedBy: Array.isArray(p.repostedBy)
                  ? p.repostedBy.filter((id): id is number => typeof id === "number" && !!merged[id])
                  : [],
              })
            );
          if ((saved.samplePostsVersion ?? 0) < SAMPLE_POSTS_VERSION) {
            const restoredIds = new Set(restored.map((p) => p.id));
            restored.push(...INITIAL_POSTS.filter((p) => p.id <= 100 && !restoredIds.has(p.id)));
          }
          setPosts(restored);
        }
        if (typeof saved.currentUserId === "number" && merged[saved.currentUserId]) {
          setCurrentUserId(saved.currentUserId);
        }
        if (Array.isArray(saved.notifications)) setNotifications(saved.notifications);
        if (saved.bookmarks && typeof saved.bookmarks === "object") {
          const b: Record<number, number[]> = {};
          for (const [key, list] of Object.entries(saved.bookmarks)) {
            if (Array.isArray(list)) b[Number(key)] = list.filter((x): x is number => typeof x === "number");
          }
          setBookmarks(b);
        }
        if (saved.following && typeof saved.following === "object") {
          const restored: Record<number, number[]> = {};
          for (const [key, list] of Object.entries(saved.following)) {
            const userId = Number(key);
            if (!merged[userId] || !Array.isArray(list)) continue;
            restored[userId] = [...new Set(
              list.filter((id): id is number => typeof id === "number" && id !== userId && !!merged[id])
            )];
          }
          setFollowing(restored);
        }
        if (saved.blockedUsers && typeof saved.blockedUsers === "object") {
          const restored: Record<number, number[]> = {};
          for (const [key, list] of Object.entries(saved.blockedUsers)) {
            const userId = Number(key);
            if (!merged[userId] || !Array.isArray(list)) continue;
            restored[userId] = [...new Set(
              list.filter((id): id is number => typeof id === "number" && id !== userId && !!merged[id])
            )];
          }
          setBlockedUsers(restored);
        }
        if (Array.isArray(saved.messages)) {
          setMessages(
            saved.messages
              .filter((message): message is ChatMessage =>
                !!message &&
                typeof message.id === "number" &&
                typeof message.fromUserId === "number" &&
                typeof message.toUserId === "number" &&
                message.fromUserId !== message.toUserId &&
                !!merged[message.fromUserId] &&
                !!merged[message.toUserId] &&
                typeof message.text === "string" &&
                typeof message.createdAt === "number"
              )
              .map((message) => ({ ...message, text: message.text.trim().slice(0, 1000) }))
              .filter((message) => message.text.length > 0)
          );
        }
        if (Array.isArray(saved.accountReports)) {
          setAccountReports(
            saved.accountReports.filter((report) =>
              !!report &&
              typeof report.reporterId === "number" &&
              typeof report.targetUserId === "number" &&
              report.reporterId !== report.targetUserId &&
              !!merged[report.reporterId] &&
              !!merged[report.targetUserId] &&
              typeof report.reason === "string" &&
              typeof report.createdAt === "number"
            )
          );
        }
      }

      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
    } catch {
      // повреждённые данные игнорируем, остаются значения по умолчанию
    }
    setReady(true);
  }, []);

  /* ---------- Сохранение: любое изменение сразу уходит в localStorage ---------- */
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          samplePostsVersion: SAMPLE_POSTS_VERSION,
          posts,
          users,
          currentUserId,
          notifications,
          bookmarks,
          following,
          blockedUsers,
          messages,
          accountReports,
        })
      );
    } catch {
      // хранилище переполнено или недоступно
    }
  }, [posts, users, currentUserId, notifications, bookmarks, following, blockedUsers, messages, accountReports, ready]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (!ready) return;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme, ready]);

  // Если данные поменяли в другой вкладке, подхватываем их
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && (e.newValue === "dark" || e.newValue === "light")) setTheme(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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

  const updateUser = useCallback(
    (id: number, firstName: string, lastName: string, bio: string) => {
      setUsers((prev) => ({ ...prev, [id]: { ...prev[id], firstName, lastName, bio } }));
      pushToast("Профиль обновлён");
    },
    [pushToast]
  );

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
      return { ok: true, id, username };
    },
    [pushToast]
  );

  /* ---------- Посты (после публикации не редактируются, только удаляются) ---------- */
  const addPost = useCallback(
    (title: string, body: string, revealLikes: number, media: PostMedia[] = []) => {
      const id = nextId();
      const newPost: Post = {
        id,
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
        media,
        repostedBy: [],
      };
      setPosts((prev) => [newPost, ...prev]);
      pushToast(`Пост опубликован анонимно. Автор раскроется после ${revealLikes} лайков`);
      return id;
    },
    [currentUserId, pushToast]
  );

  // Удалить пост может его автор или модератор
  const deletePost = useCallback(
    (id: number) => {
      const target = postsRef.current.find((post) => post.id === id);
      if (!target || !(target.userId === currentUserId || isModerator)) return;
      setPosts((prev) => prev.filter((p) => p.id !== id || !(p.userId === currentUserId || isModerator)));
      void deleteMediaFiles(target.media).catch(() => {
        pushToast("Пост удалён, но не удалось очистить его медиафайлы");
      });
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

  const toggleRepost = useCallback(
    (postId: number) => {
      const target = postsRef.current.find((post) => post.id === postId);
      if (!target) return;
      const reposted = target.repostedBy.includes(currentUserId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                repostedBy: reposted
                  ? post.repostedBy.filter((userId) => userId !== currentUserId)
                  : [currentUserId, ...post.repostedBy],
              }
            : post
        )
      );
      pushToast(reposted ? "Репост отменён" : "Пост добавлен в ваши репосты");
    },
    [currentUserId, pushToast]
  );

  /* ---------- Сохранённое (у каждого пользователя свой список) ---------- */
  const toggleBookmark = useCallback(
    (postId: number) => {
      const list = bookmarksRef.current[currentUserId] ?? [];
      const saved = list.includes(postId);
      setBookmarks((prev) => {
        const mine = prev[currentUserId] ?? [];
        return { ...prev, [currentUserId]: saved ? mine.filter((id) => id !== postId) : [postId, ...mine] };
      });
      pushToast(saved ? "Убрано из сохранённого" : "Сохранено");
    },
    [currentUserId, pushToast]
  );

  const savedIds = useMemo(
    () => (bookmarks[currentUserId] ?? []).filter((id) => posts.some((p) => p.id === id)),
    [bookmarks, currentUserId, posts]
  );

  /* ---------- Подписки ---------- */
  const followingIds = useMemo(() => following[currentUserId] ?? [], [following, currentUserId]);
  const followerCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    Object.values(following).forEach((ids) => {
      ids.forEach((id) => {
        counts[id] = (counts[id] ?? 0) + 1;
      });
    });
    return counts;
  }, [following]);
  const blockedUserIds = useMemo(() => blockedUsers[currentUserId] ?? [], [blockedUsers, currentUserId]);
  const blockedByUserIds = useMemo(
    () => Object.entries(blockedUsers)
      .filter(([id, ids]) => Number(id) !== currentUserId && ids.includes(currentUserId))
      .map(([id]) => Number(id)),
    [blockedUsers, currentUserId]
  );

  const toggleFollow = useCallback(
    (userId: number) => {
      if (userId === currentUserId || !users[userId] || blockedUserIds.includes(userId) || blockedByUserIds.includes(userId)) return;
      const alreadyFollowing = (following[currentUserId] ?? []).includes(userId);
      setFollowing((prev) => {
        const mine = prev[currentUserId] ?? [];
        return {
          ...prev,
          [currentUserId]: alreadyFollowing ? mine.filter((id) => id !== userId) : [userId, ...mine],
        };
      });
      pushToast(alreadyFollowing ? "Вы отписались" : `Вы подписались на @${users[userId].username}`);
    },
    [blockedByUserIds, blockedUserIds, currentUserId, following, pushToast, users]
  );

  const blockUser = useCallback(
    (userId: number) => {
      if (userId === currentUserId || !users[userId]) return;
      setBlockedUsers((prev) => {
        const mine = prev[currentUserId] ?? [];
        return mine.includes(userId) ? prev : { ...prev, [currentUserId]: [userId, ...mine] };
      });
      setFollowing((prev) => ({
        ...prev,
        [currentUserId]: (prev[currentUserId] ?? []).filter((id) => id !== userId),
      }));
      pushToast(`@${users[userId].username} заблокирован`);
    },
    [currentUserId, pushToast, users]
  );

  const unblockUser = useCallback(
    (userId: number) => {
      setBlockedUsers((prev) => ({
        ...prev,
        [currentUserId]: (prev[currentUserId] ?? []).filter((id) => id !== userId),
      }));
      pushToast("Пользователь разблокирован");
    },
    [currentUserId, pushToast]
  );

  const reportUser = useCallback(
    (userId: number, reason: string) => {
      if (
        userId === currentUserId ||
        !users[userId] ||
        !reason ||
        accountReports.some((report) => report.reporterId === currentUserId && report.targetUserId === userId)
      ) return;
      setAccountReports((prev) => [
        ...prev,
        { reporterId: currentUserId, targetUserId: userId, reason, createdAt: Date.now() },
      ]);
      pushToast("Жалоба на профиль отправлена модератору");
    },
    [accountReports, currentUserId, pushToast, users]
  );

  const dismissAccountReports = useCallback(
    (userId: number) => {
      if (!isModerator) return;
      setAccountReports((prev) => prev.filter((report) => report.targetUserId !== userId));
      pushToast("Жалобы на профиль рассмотрены");
    },
    [isModerator, pushToast]
  );

  const sendMessage = useCallback(
    (userId: number, text: string) => {
      const clean = text.trim().slice(0, 1000);
      if (userId === currentUserId || !users[userId] || !clean) return false;
      if (blockedUserIds.includes(userId) || blockedByUserIds.includes(userId)) {
        pushToast("Нельзя отправить сообщение: один из пользователей заблокирован");
        return false;
      }
      setMessages((prev) => [
        ...prev,
        { id: nextId(), fromUserId: currentUserId, toUserId: userId, text: clean, createdAt: Date.now() },
      ]);
      return true;
    },
    [blockedByUserIds, blockedUserIds, currentUserId, pushToast, users]
  );

  /* ---------- Комментарии ---------- */
  const addComment = useCallback(
    (postId: number, text: string) => {
      const clean = text.trim().slice(0, 300);
      if (!clean) return;
      const target = postsRef.current.find((p) => p.id === postId);
      if (!target) return;
      const comment: Comment = { id: nextId(), userId: currentUserId, text: clean, createdAt: Date.now(), reports: [] };
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)));
      if (target.userId !== currentUserId) {
        addNotification({ userId: target.userId, type: "comment", postId, commentId: comment.id, fromUserId: currentUserId });
      }
    },
    [currentUserId, addNotification]
  );

  // Удалить комментарий может его автор, автор поста или модератор
  const deleteComment = useCallback(
    (postId: number, commentId: number) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments.filter(
                  (c) => c.id !== commentId || !(c.userId === currentUserId || isModerator || p.userId === currentUserId)
                ),
              }
            : p
        )
      );
    },
    [currentUserId, isModerator]
  );

  /* ---------- Жалобы на посты и комментарии ---------- */
  const notifyModerators = useCallback(
    (postId: number, commentId?: number) => {
      Object.values(usersRef.current)
        .filter((u) => u.role === "moderator" && u.id !== currentUserId)
        .forEach((m) => addNotification({ userId: m.id, type: "report", postId, commentId, fromUserId: currentUserId }));
    },
    [currentUserId, addNotification]
  );

  const reportPost = useCallback(
    (postId: number, reason: string) => {
      const target = postsRef.current.find((p) => p.id === postId);
      if (!target || target.userId === currentUserId || target.reports.some((r) => r.userId === currentUserId)) return;
      const report: Report = { userId: currentUserId, reason, createdAt: Date.now() };
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reports: [...p.reports, report] } : p)));
      notifyModerators(postId);
      pushToast("Жалоба на пост отправлена модератору");
    },
    [currentUserId, notifyModerators, pushToast]
  );

  const reportComment = useCallback(
    (postId: number, commentId: number, reason: string) => {
      const target = postsRef.current.find((p) => p.id === postId);
      const comment = target?.comments.find((c) => c.id === commentId);
      if (!target || !comment || comment.userId === currentUserId || comment.reports.some((r) => r.userId === currentUserId)) return;
      const report: Report = { userId: currentUserId, reason, createdAt: Date.now() };
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: p.comments.map((c) => (c.id === commentId ? { ...c, reports: [...c.reports, report] } : c)) }
            : p
        )
      );
      notifyModerators(postId, commentId);
      pushToast("Жалоба на комментарий отправлена модератору");
    },
    [currentUserId, notifyModerators, pushToast]
  );

  const dismissReports = useCallback(
    (postId: number) => {
      if (!isModerator) return;
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reports: [] } : p)));
      pushToast("Жалобы на пост отклонены");
    },
    [isModerator, pushToast]
  );

  const dismissCommentReports = useCallback(
    (postId: number, commentId: number) => {
      if (!isModerator) return;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: p.comments.map((c) => (c.id === commentId ? { ...c, reports: [] } : c)) } : p
        )
      );
      pushToast("Жалобы на комментарий отклонены");
    },
    [isModerator, pushToast]
  );

  /* ---------- Сброс демо-данных ---------- */
  const resetData = useCallback(async () => {
    try {
      await clearMediaFiles();
      [STORAGE_KEY, OLD_STORAGE_KEY, FEED_PREFS_KEY, DRAFT_KEY, INTRO_KEY].forEach((k) => localStorage.removeItem(k));
    } catch {
      pushToast("Не удалось сбросить данные и медиафайлы");
      return;
    }
    window.location.assign("/");
  }, [pushToast]);

  const value = useMemo<AppContextType>(
    () => ({
      ready, posts, users, currentUser, isModerator, theme, savedIds, followingIds, followerCounts,
      blockedUserIds, blockedByUserIds, messages, accountReports,
      notifications: myNotifications, unreadCount, toasts,
      switchAccount, toggleTheme, registerUser, updateUser,
      addPost, deletePost, toggleLike, toggleRepost, toggleBookmark, toggleFollow,
      blockUser, unblockUser, reportUser, dismissAccountReports, sendMessage,
      addComment, deleteComment,
      reportPost, reportComment, dismissReports, dismissCommentReports,
      markNotificationsRead, pushToast, resetData,
    }),
    [
      ready, posts, users, currentUser, isModerator, theme, savedIds, followingIds, followerCounts,
      blockedUserIds, blockedByUserIds, messages, accountReports,
      myNotifications, unreadCount, toasts,
      switchAccount, toggleTheme, registerUser, updateUser,
      addPost, deletePost, toggleLike, toggleRepost, toggleBookmark, toggleFollow,
      blockUser, unblockUser, reportUser, dismissAccountReports, sendMessage,
      addComment, deleteComment,
      reportPost, reportComment, dismissReports, dismissCommentReports,
      markNotificationsRead, pushToast, resetData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
