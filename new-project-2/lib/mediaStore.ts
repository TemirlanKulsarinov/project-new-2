export type MediaKind = "image" | "video" | "audio";

export interface PostMedia {
  id: string;
  name: string;
  mimeType: string;
  kind: MediaKind;
  size: number;
}

const DATABASE_NAME = "secretspace-media";
const STORE_NAME = "attachments";
const DATABASE_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Браузер не поддерживает локальное хранилище медиа."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Не удалось открыть хранилище медиа."));
    request.onblocked = () => reject(new Error("Хранилище медиа занято другой вкладкой."));
  });
}

function mediaKind(file: File): MediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

export async function saveMediaFiles(files: File[]): Promise<PostMedia[]> {
  if (files.length === 0) return [];
  const attachments = files.map((file) => {
    const kind = mediaKind(file);
    if (!kind) throw new Error(`Формат файла «${file.name}» не поддерживается.`);
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      mimeType: file.type,
      kind,
      size: file.size,
    };
  });
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    attachments.forEach((attachment, index) => store.put(files[index], attachment.id));
    transaction.oncomplete = () => {
      database.close();
      resolve(attachments);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Не удалось сохранить медиафайлы."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Сохранение медиафайлов отменено."));
    };
  });
}

export async function loadMediaFile(id: string): Promise<Blob | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);
    let result: Blob | null = null;
    request.onsuccess = () => {
      result = request.result instanceof Blob ? request.result : null;
    };
    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error("Не удалось прочитать медиафайл."));
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Не удалось прочитать медиафайл."));
    };
  });
}

export async function deleteMediaFiles(attachments: PostMedia[]): Promise<void> {
  if (attachments.length === 0 || typeof indexedDB === "undefined") return;
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    attachments.forEach((attachment) => store.delete(attachment.id));
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Не удалось удалить медиафайлы."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Удаление медиафайлов отменено."));
    };
  });
}

export async function clearMediaFiles(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Не удалось очистить хранилище медиа."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Очистка хранилища медиа отменена."));
    };
  });
}
