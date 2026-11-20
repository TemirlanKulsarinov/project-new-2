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

const isIndexedDbAvailable = (): boolean => typeof indexedDB !== "undefined";

function openDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
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

interface TransactionMessages {
  error: string;
  abort?: string;
}

/**
 * Opens the database, runs `action` in a single transaction and always
 * closes the database afterwards. `action` may return a getter for the
 * final result, which is read when the transaction completes.
 */
async function runTransaction<T = void>(
  mode: IDBTransactionMode,
  messages: TransactionMessages,
  action: (store: IDBObjectStore, fail: (error: unknown) => void) => (() => T) | void,
): Promise<T> {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const fail = (error: unknown) => {
      database.close();
      reject(error);
    };

    const getResult = action(transaction.objectStore(STORE_NAME), fail);

    transaction.oncomplete = () => {
      database.close();
      resolve(getResult ? getResult() : (undefined as T));
    };
    transaction.onerror = () => fail(transaction.error ?? new Error(messages.error));
    if (messages.abort) {
      const abortMessage = messages.abort;
      transaction.onabort = () => fail(transaction.error ?? new Error(abortMessage));
    }
  });
}

function mediaKind(file: File): MediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

function createAttachment(file: File): PostMedia {
  const kind = mediaKind(file);
  if (!kind) throw new Error(`Формат файла «${file.name}» не поддерживается.`);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: file.name,
    mimeType: file.type,
    kind,
    size: file.size,
  };
}

export async function saveMediaFiles(files: File[]): Promise<PostMedia[]> {
  if (files.length === 0) return [];
  const attachments = files.map(createAttachment);

  return runTransaction(
    "readwrite",
    { error: "Не удалось сохранить медиафайлы.", abort: "Сохранение медиафайлов отменено." },
    (store) => {
      attachments.forEach((attachment, index) => store.put(files[index], attachment.id));
      return () => attachments;
    },
  );
}

export async function loadMediaFile(id: string): Promise<Blob | null> {
  return runTransaction<Blob | null>(
    "readonly",
    { error: "Не удалось прочитать медиафайл." },
    (store, fail) => {
      const request = store.get(id);
      let result: Blob | null = null;
      request.onsuccess = () => {
        result = request.result instanceof Blob ? request.result : null;
      };
      request.onerror = () => fail(request.error ?? new Error("Не удалось прочитать медиафайл."));
      return () => result;
    },
  );
}

export async function deleteMediaFiles(attachments: PostMedia[]): Promise<void> {
  if (attachments.length === 0 || !isIndexedDbAvailable()) return;

  return runTransaction(
    "readwrite",
    { error: "Не удалось удалить медиафайлы.", abort: "Удаление медиафайлов отменено." },
    (store) => {
      attachments.forEach((attachment) => store.delete(attachment.id));
    },
  );
}

export async function clearMediaFiles(): Promise<void> {
  if (!isIndexedDbAvailable()) return;

  return runTransaction(
    "readwrite",
    { error: "Не удалось очистить хранилище медиа.", abort: "Очистка хранилища медиа отменена." },
    (store) => {
      store.clear();
    },
  );
}