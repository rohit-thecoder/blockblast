const memory = new Map<string, string>();

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const key = '__blockblast_storage_probe__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return window.localStorage;
  } catch { return null; }
}

/** Falls back to in-memory state if embedded/private browsing blocks localStorage. */
export async function getStoredItem(key: string): Promise<string | null> {
  const persistent = storage();
  return persistent ? persistent.getItem(key) : memory.get(key) ?? null;
}

export async function setStoredItem(key: string, value: string): Promise<void> {
  const persistent = storage();
  if (persistent) persistent.setItem(key, value);
  else memory.set(key, value);
}
