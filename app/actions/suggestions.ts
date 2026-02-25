"use server";

import { auth } from "@/app/(auth)/auth";
import { googleModels } from "@/ai";
import { generateSimpleText } from "@/lib/ai-utils";
import { Suggestion } from "@/lib/suggestions";
import { getDynamicSuggestions } from "@/lib/suggestions-service";

export async function fetchUserSuggestions(): Promise<Suggestion[]> {
  const session = await auth();
  const userId = session?.user?.id || null;
  
  return getDynamicSuggestions(userId);
}

export async function fetchContextualSuggestions(contextText: string, parentText?: string): Promise<Suggestion[]> {
  try {
    const prompt = `Analyze this text context and suggest 3 highly relevant follow-up actions or questions a user might have.
Context text (highlighted): "${contextText}"
${parentText ? `Parent message: "${parentText}"` : ''}

Return exactly 3 lines in this format, nothing else:
"Action/Question Label"|icon_name|color

Allowed icon_names: message, diagram, code
Allowed colors: blue, green, orange, purple, indigo, rose, teal

Keep labels very concise (under 6 words).`;

    const response = await generateSimpleText(googleModels.title, prompt);
    const lines = response.split('\n').filter(l => l.includes('|')).slice(0, 3);
    
    if (lines.length === 0) return [];

    return lines.map(line => {
      const [label, iconName, color] = line.split('|');
      return {
        label: label.replace(/"/g, '').trim(),
        value: label.replace(/"/g, '').trim(),
        iconName: (iconName || 'message').trim(),
        color: (color || 'blue').trim()
      } as Suggestion;
    });
  } catch (err) {
    console.error("Failed contextual suggestions", err);
    return [];
  }
}
