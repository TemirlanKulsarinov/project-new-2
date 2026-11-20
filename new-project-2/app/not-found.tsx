import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-[30px] shadow-sm p-12 text-center mb-12">
      <div className="text-6xl font-black text-black dark:text-white mb-2">404</div>
      <h1 className="text-xl font-bold text-black dark:text-white mb-2">Страница не найдена</h1>
      <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">Такой страницы нет. Возможно, ссылка устарела.</p>
      <Link href="/" className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full text-sm font-bold">
        В ленту
      </Link>
    </div>
  );
}
