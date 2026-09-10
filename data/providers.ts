export const providers = [
  "OpenAI", "Anthropic", "Google", "GitHub", "Stripe", "Notion", "Slack",
  "Cloudflare", "Supabase", "Vercel", "Postman", "Redis", "Docker",
  "Microsoft", "Figma", "Sentry", "Hugging Face", "Model Context Protocol",
] as const;

export type Provider = (typeof providers)[number];
