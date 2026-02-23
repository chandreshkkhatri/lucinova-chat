import { Chat } from "@/db/models";
import { ensureConnection } from "@/db/connection";
import { SUGGESTION_LIBRARY, Suggestion } from "./suggestions";

/**
 * Fetches dynamic suggestions for a user based on their recent chat categories.
 */
export async function getDynamicSuggestions(userId: string | null): Promise<Suggestion[]> {
  await ensureConnection();

  // 1. Fallback for guests or new users
  if (!userId) {
    return getRandomSuggestions(5);
  }

  try {
    // 2. Fetch last 20 chats to determine user's common categories
    const recentChats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("category")
      .lean();

    if (!recentChats.length) {
      return getRandomSuggestions(5);
    }

    // 3. Count category frequencies
    const categoryCounts: Record<string, number> = {};
    recentChats.forEach((chat) => {
      if (chat.category) {
        categoryCounts[chat.category] = (categoryCounts[chat.category] || 0) + 1;
      }
    });

    // 4. Sort categories by frequency
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);

    // 5. Build dynamic suggestion set
    // Goal: 3 highly relevant suggestions (top categories) + 2 diverse/general ones
    const dynamicSuggestions: Suggestion[] = [];
    const usedIndices = new Set<number>();

    // Add relevant suggestions from top categories
    for (const cat of sortedCategories) {
      const catSuggestions = SUGGESTION_LIBRARY.filter(s => s.category === cat);
      if (catSuggestions.length) {
        // Pick one unique suggestion from this category
        const available = catSuggestions.filter(s => !dynamicSuggestions.some(ds => ds.label === s.label));
        if (available.length) {
          const picked = available[Math.floor(Math.random() * available.length)];
          dynamicSuggestions.push(picked);
        }
      }
      if (dynamicSuggestions.length >= 3) break;
    }

    // Fill the rest with diverse suggestions (General or other categories)
    while (dynamicSuggestions.length < 5) {
      const remaining = SUGGESTION_LIBRARY.filter(s => !dynamicSuggestions.some(ds => ds.label === s.label));
      if (!remaining.length) break;
      const picked = remaining[Math.floor(Math.random() * remaining.length)];
      dynamicSuggestions.push(picked);
    }

    return dynamicSuggestions;
  } catch (error) {
    console.error("[Suggestions Service] Error fetching dynamic suggestions:", error);
    return getRandomSuggestions(5);
  }
}

function getRandomSuggestions(count: number): Suggestion[] {
  const shuffled = [...SUGGESTION_LIBRARY].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
