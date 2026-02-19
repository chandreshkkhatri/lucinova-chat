import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, number>>;
};

/**
 * Fetches thread counts for ALL messages in a chat in a single API call.
 * Returns a map of { [messageId]: count }.
 */
export function useThreadCounts(chatId: string) {
  const { data, isLoading, mutate } = useSWR(
    chatId ? `/api/threads/counts?chatId=${chatId}` : null,
    fetcher,
    {
      fallbackData: {},
      revalidateOnFocus: false,
      // Revalidate after a new reply is created
      dedupingInterval: 10000,
    }
  );

  return { threadCounts: data ?? {}, isLoading, refresh: mutate };
}
