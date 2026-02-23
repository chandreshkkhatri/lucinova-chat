"use server";

import { auth } from "@/app/(auth)/auth";
import { getDynamicSuggestions } from "@/lib/suggestions-service";
import { Suggestion } from "@/lib/suggestions";

export async function fetchUserSuggestions(): Promise<Suggestion[]> {
  const session = await auth();
  const userId = session?.user?.id || null;
  
  return getDynamicSuggestions(userId);
}
