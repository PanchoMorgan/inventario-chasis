const DB_NAME = "ScaniaPatioDB";
const DB_VERSION = 1;
const STORE_NAME = "registros";

function openDB() {
  return new Promise((resolve, reject) => {

    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {

      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {

        const store = db.createObjectStore(
          STORE_NAME,
          {
            keyPath: "id",
            autoIncrement: true,
          }
        );

        store.createIndex(
          "chassis",
          "chassis",
          { unique: false }
        );

        store.createIndex(
          "popid",
          "popid",
          { unique: false }
        );

        store.createIndex(
          "fecha",
          "fecha",
          { unique: false }
        );
      }
    };
  });
}


export async function getAllRecords() {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction =
      db.transaction(STORE_NAME, "readonly");

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}


export async function addRecord(record) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction =
      db.transaction(STORE_NAME, "readwrite");

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.add(record);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}


export async function clearRecords() {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction =
      db.transaction(STORE_NAME, "readwrite");

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}