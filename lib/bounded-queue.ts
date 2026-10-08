export async function runBoundedQueue<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
) {
  if (items.length === 0) return;
  const workerCount = Math.min(items.length, Math.max(1, Math.floor(concurrency)));
  let cursor = 0;

  async function consume() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => consume()));
}
