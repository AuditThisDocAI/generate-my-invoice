import localforage from "localforage";

// Configure localforage databases
localforage.config({
  name: "smart_invoice_creator_db",
  storeName: "invoice_offline_store"
});

export interface SyncQueueItem {
  id: string;
  userId: string;
  docId: string;
  collection?: string;
  payload: any;
  action: "save" | "delete";
  timestamp: number;
}

/**
 * Persist the user profile offline so that the app can display credit balances and current account tier offline.
 */
export async function saveProfileOffline(profile: any): Promise<void> {
  try {
    if (profile && profile.uid) {
      await localforage.setItem(`profile_${profile.uid}`, profile);
    }
  } catch (err) {
    console.error("Failed to cache profile offline:", err);
  }
}

/**
 * Retrieve cached user profile offline.
 */
export async function getProfileOffline(uid: string): Promise<any | null> {
  try {
    return await localforage.getItem(`profile_${uid}`);
  } catch (err) {
    console.error("Failed to retrieve offline profile:", err);
    return null;
  }
}

/**
 * Retrieve list of offline invoices for a specific user.
 */
export async function getLocalInvoices(uid: string): Promise<any[]> {
  try {
    const list = await localforage.getItem<any[]>(`invoices_list_${uid}`);
    return list || [];
  } catch (err) {
    console.error("Failed to load offline local invoices list:", err);
    return [];
  }
}

/**
 * Cache lists of invoices offline for responsive loading.
 */
export async function saveLocalInvoices(uid: string, invoices: any[]): Promise<void> {
  try {
    await localforage.setItem(`invoices_list_${uid}`, invoices);
  } catch (err) {
    console.error("Failed to save offline local invoices list:", err);
  }
}

/**
 * Save / Update an invoice in local indexedDB cache.
 */
export async function saveInvoiceLocally(uid: string, docId: string, payload: any): Promise<void> {
  try {
    // 1. Cache single item detail
    await localforage.setItem(`invoice_${uid}_${docId}`, payload);
    
    // 2. Add / update inside indices
    const list = await getLocalInvoices(uid);
    const index = list.findIndex((x) => x.id === docId);
    if (index > -1) {
      list[index] = payload;
    } else {
      list.push(payload);
    }
    await saveLocalInvoices(uid, list);
  } catch (err) {
    console.error("Failed to save invoice locally:", err);
  }
}

/**
 * Add an action to the local synchronization queue.
 */
export async function queueSyncAction(action: SyncQueueItem): Promise<void> {
  try {
    const queue = await localforage.getItem<SyncQueueItem[]>("sync_queue") || [];
    // Remove previous actions for the same document to keep queue size streamlined
    const filtered = queue.filter((x) => !(x.docId === action.docId && x.action === action.action));
    filtered.push(action);
    await localforage.setItem("sync_queue", filtered);
    console.log("📥 Action queued for cloud synchronization:", action.docId);
  } catch (err) {
    console.error("Failed to queue sync task:", err);
  }
}

/**
 * Load the active unsynced operational items queue.
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    return await localforage.getItem<SyncQueueItem[]>("sync_queue") || [];
  } catch (err) {
    console.error("Failed to fetch pending sync queue:", err);
    return [];
  }
}

/**
 * Refresh/Save the sync queue.
 */
export async function saveSyncQueue(queue: SyncQueueItem[]): Promise<void> {
  try {
    await localforage.setItem("sync_queue", queue);
  } catch (err) {
    console.error("Failed to save sync queue:", err);
  }
}

/**
 * Remove an item from the sync queue when successfully processed.
 */
export async function dequeueSyncAction(actionId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const updated = queue.filter((x) => x.id !== actionId);
    await saveSyncQueue(updated);
  } catch (err) {
    console.error("Failed to remove sync task:", err);
  }
}
