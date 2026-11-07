import type { MetadataRoute } from "next";
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return {
    name: "Fitimart — RSS-powered simulated marketplace",
    short_name: "Fitimart",
    description: "Collect open-web discoveries and speculative ideas in a local-first simulated economy.",
    start_url: `${basePath}/`,
    display: "standalone",
    background_color: "#f3f2ee",
    theme_color: "#121311",
    lang: "en",
  };
}
