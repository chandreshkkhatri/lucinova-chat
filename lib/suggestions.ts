export interface Suggestion {
  label: string;
  value: string;
  iconName: "message" | "diagram" | "code" | "sparkles";
  color: "blue" | "green" | "orange" | "purple" | "indigo" | "rose" | "teal";
  category: "Coding" | "Academic" | "Creative" | "Business" | "Data" | "General";
}

export const SUGGESTION_LIBRARY: Suggestion[] = [
  // Coding
  {
    label: "Bootstrap a SaaS Project",
    value: "Help me bootstrap a high-performance Next.js web project using TypeScript, Tailwind CSS, and Shadcn UI. What's the best component-based folder structure for scalability?",
    iconName: "code",
    color: "blue",
    category: "Coding",
  },
  {
    label: "Debug a Memory Leak",
    value: "I'm experiencing a persistent memory leak in my React application when using WebSockets and heavy state management. How can I identify the root cause and implement a robust cleanup strategy?",
    iconName: "code",
    color: "rose",
    category: "Coding",
  },
  {
    label: "Expert Code Review",
    value: "Act as a Senior Software Engineer. Review the following authentication middleware code for performance bottlenecks, security vulnerabilities, and adherence to Clean Code principles: ",
    iconName: "code",
    color: "orange",
    category: "Coding",
  },
  {
    label: "Optimize SQL Query",
    value: "How can I optimize a slow SQL query that involves multiple joins, window functions, and over 1 million rows? Provide a step-by-step guide on indexing and execution plan analysis.",
    iconName: "code",
    color: "teal",
    category: "Coding",
  },

  // Academic / Research
  {
    label: "Explain Quantum Physics",
    value: "Explain the fundamental principles of Quantum Entanglement as if I'm a high school student. Use relatable analogies like spinning coins and avoid overly complex jargon.",
    iconName: "message",
    color: "purple",
    category: "Academic",
  },
  {
    label: "Clinical AI Research Guide",
    value: "Help me create a comprehensive outline for a literature review on The Impact of Generative AI on Clinical Diagnosis. Focus on key themes like data privacy and algorithmic bias.",
    iconName: "message",
    color: "indigo",
    category: "Academic",
  },
  {
    label: "Learn Spanish in 3 Months",
    value: "Design a customized daily study plan for reaching conversational fluency in Spanish within 3 months for a beginner traveler. Focus on the top 500 most frequent words.",
    iconName: "sparkles",
    color: "teal",
    category: "Academic",
  },

  // Creative
  {
    label: "Cyberpunk Story Prompts",
    value: "Generate 5 unique Science Fiction story prompts centered around time travel paradoxes and forgotten memories in a dark, neon-lit cyberpunk metropolis.",
    iconName: "sparkles",
    color: "purple",
    category: "Creative",
  },
  {
    label: "Write an Atmospheric Poem",
    value: "Write a short, evocative poem about the eerie silence of a coastal town during a winter storm. Focus on sensory details like the smell of salt and the sound of crashing waves.",
    iconName: "message",
    color: "rose",
    category: "Creative",
  },
  {
    label: "Modern Logo Design Ideas",
    value: "Suggest 3 minimalist logo concepts for a brand called 'Lucidity' that specializes in AI-driven clarity. Describe the shapes, symbolism, and a professional blue/slate color palette.",
    iconName: "diagram",
    color: "orange",
    category: "Creative",
  },

  // Business
  {
    label: "Vertical Farming Strategy",
    value: "Draft a high-level business strategy and investor pitch for a startup focused on vertical farming in urban environments. Include a SWOT analysis and 3-year growth milestones.",
    iconName: "message",
    color: "blue",
    category: "Business",
  },
  {
    label: "Pitch Meeting Follow-up",
    value: "Write a professional follow-up email to a potential venture capitalist after an initial pitch meeting. Highlight our product traction and request a technical deep-dive meeting.",
    iconName: "message",
    color: "indigo",
    category: "Business",
  },
  {
    label: "FinTech Market Framework",
    value: "What are the core components of a competitive market analysis for a SaaS product in the FinTech industry? Provide a framework for analyzing direct competitors and market share.",
    iconName: "sparkles",
    color: "teal",
    category: "Business",
  },

  // Data / Diagrams
  {
    label: "SaaS Database Schema",
    value: "Create a Mermaid entity-relationship diagram for a SaaS Project Management Tool. Include entities like Users, Projects, Tasks, and Workspaces with clear foreign key relationships.",
    iconName: "diagram",
    color: "green",
    category: "Data",
  },
  {
    label: "Customer Onboarding Flow",
    value: "Visualize the customer onboarding process for a B2B platform using a Mermaid flowchart. Detail every step from initial sign-up to the first successful transaction.",
    iconName: "diagram",
    color: "blue",
    category: "Data",
  },
  {
    label: "E-commerce Trend Analysis",
    value: "How should I approach identifying seasonal patterns in a dataset containing 3 years of e-commerce sales data? Suggest specific statistical methods and visualization types.",
    iconName: "sparkles",
    color: "teal",
    category: "Data",
  },

  // General
  {
    label: "7-Day Kyoto Itinerary",
    value: "Plan a budget-friendly 7-day cultural itinerary for Kyoto, Japan. Focus on hidden temples, traditional tea houses, and local craft workshops away from major tourist crowds.",
    iconName: "message",
    color: "orange",
    category: "General",
  },
  {
    label: "Prioritize Startup Tasks",
    value: "I'm overwhelmed with tasks. Use the Eisenhower Matrix to help me prioritize my workload for launching a new software product. Help me sort what's truly urgent vs. important.",
    iconName: "sparkles",
    color: "indigo",
    category: "General",
  },
];
