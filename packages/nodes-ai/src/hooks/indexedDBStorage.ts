import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StateStorage } from 'zustand/middleware';

interface WorkflowDB extends DBSchema {
  workflows: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'ai-workflow-db';
const STORE_NAME = 'workflows';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WorkflowDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<WorkflowDB>> => {
  // Check if IndexedDB is available (not available during SSR)
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available'));
  }

  if (!dbPromise) {
    dbPromise = openDB<WorkflowDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create the workflows object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

/**
 * IndexedDB storage for Zustand persist middleware
 * Handles large data like base64 images much better than localStorage
 */
export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const db = await getDB();
      const value = await db.get(STORE_NAME, name);
      // createJSONStorage expects a string, so we return the stringified value
      return value !== undefined ? JSON.stringify(value) : null;
    } catch (error) {
      // Silently return null during SSR or when IndexedDB is not available
      if (typeof indexedDB === 'undefined') {
        return null;
      }
      console.error('IndexedDB getItem error:', error);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const db = await getDB();
      // createJSONStorage passes a string, so we parse it before storing
      const parsedValue = JSON.parse(value);
      await db.put(STORE_NAME, parsedValue, name);
    } catch (error) {
      console.error('IndexedDB setItem error:', error);
      // Don't throw - gracefully degrade
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      const db = await getDB();
      await db.delete(STORE_NAME, name);
    } catch (error) {
      console.error('IndexedDB removeItem error:', error);
    }
  },
};

/**
 * Clear all workflow data from IndexedDB
 * Useful for debugging or user-requested data reset
 */
export const clearWorkflowStorage = async (): Promise<void> => {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
    console.log('Workflow storage cleared');
  } catch (error) {
    console.error('Error clearing workflow storage:', error);
  }
};

/**
 * Get database statistics
 * Useful for monitoring storage usage
 */
export const getStorageStats = async (): Promise<{
  itemCount: number;
  keys: string[];
}> => {
  try {
    const db = await getDB();
    const keys = await db.getAllKeys(STORE_NAME);
    return {
      itemCount: keys.length,
      keys: keys as string[],
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { itemCount: 0, keys: [] };
  }
};
