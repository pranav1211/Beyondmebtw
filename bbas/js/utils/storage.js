/* ========================================
   BBAS - Storage Component
   IndexedDB storage for boundaries and settings
   ======================================== */

const DB_NAME = 'BBAS_Database';
const DB_VERSION = 1;
const BOUNDARIES_STORE = 'boundaries';
const SETTINGS_STORE = 'settings';

class Storage {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      console.log('[Storage] Initializing IndexedDB...');

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[Storage] Failed to open database', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[Storage] Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        console.log('[Storage] Database upgrade needed');
        const db = event.target.result;

        // Create boundaries object store
        if (!db.objectStoreNames.contains(BOUNDARIES_STORE)) {
          const boundariesStore = db.createObjectStore(BOUNDARIES_STORE, {
            keyPath: 'id',
            autoIncrement: true
          });
          boundariesStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('[Storage] Created boundaries store');
        }

        // Create settings object store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
          console.log('[Storage] Created settings store');
        }
      };
    });
  }

  /**
   * Save boundaries to IndexedDB
   * @param {Array} boundaries - Array of boundary polygons
   * @param {string} name - Optional name for the boundary set
   * @returns {Promise<number>} ID of saved boundaries
   */
  async saveBoundaries(boundaries, name = null) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([BOUNDARIES_STORE], 'readwrite');
      const store = transaction.objectStore(BOUNDARIES_STORE);

      const data = {
        boundaries: boundaries,
        name: name || `Boundary ${new Date().toLocaleString()}`,
        timestamp: Date.now(),
        count: boundaries.length
      };

      const request = store.add(data);

      request.onsuccess = () => {
        console.log('[Storage] Boundaries saved with ID:', request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[Storage] Failed to save boundaries', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Load boundaries by ID
   * @param {number} id - Boundary ID
   * @returns {Promise<Object>} Boundary data
   */
  async loadBoundaries(id) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([BOUNDARIES_STORE], 'readonly');
      const store = transaction.objectStore(BOUNDARIES_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          console.log('[Storage] Boundaries loaded:', request.result);
          resolve(request.result);
        } else {
          reject(new Error('Boundaries not found'));
        }
      };

      request.onerror = () => {
        console.error('[Storage] Failed to load boundaries', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all saved boundaries
   * @returns {Promise<Array>} Array of all saved boundary sets
   */
  async getAllBoundaries() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([BOUNDARIES_STORE], 'readonly');
      const store = transaction.objectStore(BOUNDARIES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log(`[Storage] Found ${request.result.length} saved boundary sets`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[Storage] Failed to get all boundaries', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get the most recent boundaries
   * @returns {Promise<Object|null>} Most recent boundary data or null
   */
  async getLatestBoundaries() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([BOUNDARIES_STORE], 'readonly');
      const store = transaction.objectStore(BOUNDARIES_STORE);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Get latest first

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          console.log('[Storage] Latest boundaries loaded:', cursor.value);
          resolve(cursor.value);
        } else {
          console.log('[Storage] No saved boundaries found');
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('[Storage] Failed to get latest boundaries', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete boundaries by ID
   * @param {number} id - Boundary ID to delete
   * @returns {Promise<void>}
   */
  async deleteBoundaries(id) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([BOUNDARIES_STORE], 'readwrite');
      const store = transaction.objectStore(BOUNDARIES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[Storage] Boundaries deleted:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('[Storage] Failed to delete boundaries', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all boundaries
   * @returns {Promise<void>}
   */
  async clearAllBoundaries() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([BOUNDARIES_STORE], 'readwrite');
      const store = transaction.objectStore(BOUNDARIES_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[Storage] All boundaries cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('[Storage] Failed to clear boundaries', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save a setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @returns {Promise<void>}
   */
  async saveSetting(key, value) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key, value });

      request.onsuccess = () => {
        console.log(`[Storage] Setting saved: ${key}`);
        resolve();
      };

      request.onerror = () => {
        console.error('[Storage] Failed to save setting', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Load a setting
   * @param {string} key - Setting key
   * @returns {Promise<*>} Setting value or null
   */
  async loadSetting(key) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          console.log(`[Storage] Setting loaded: ${key}`);
          resolve(request.result.value);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('[Storage] Failed to load setting', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[Storage] Database connection closed');
    }
  }
}

// Create singleton instance
const storage = new Storage();

export default storage;
