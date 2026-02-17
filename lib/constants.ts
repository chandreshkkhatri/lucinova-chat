export interface Suggestion {
  label: string;
  value: string;
  iconName: "message" | "diagram" | "code" | "sparkles";
  color: "blue" | "green" | "orange" | "purple";
}

export const SUGGESTIONS: Suggestion[] = [
  {
    label: "Explain Quantum Computing",
    value: "Explain the key principles of quantum computing to a 5-year old",
    iconName: "message",
    color: "blue",
  },
  {
    label: "Design a Database Schema",
    value:
      "Create a Mermaid entity-relationship diagram for an e-commerce database",
    iconName: "diagram",
    color: "green",
  },
  {
    label: "Create React Component",
    value:
      "Write a React component for a responsive navigation bar with Tailwind CSS",
    iconName: "code",
    color: "orange",
  },
  {
    label: "Summarize Article",
    value:
      "Summarize the key arguments from a provided text about climate change solutions",
    iconName: "sparkles",
    color: "purple",
  },
];
