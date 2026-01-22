/**
 * Markdown content loading utilities for category descriptions
 * At build time, Vite will bundle these as static text
 */

import { marked } from "marked";

// Import all markdown files from database folder at build time
const markdownModules = import.meta.glob("/database/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

// Cache for parsed HTML
const htmlCache: Record<string, string> = {};

/**
 * Get the rendered HTML for a category's description markdown file
 * @param categoryId - The category ID (e.g., "controllers", "pixels")
 * @returns The rendered HTML string, or null if no markdown file exists
 */
export function getCategoryDescription(categoryId: string): string | null {
  // Check cache first
  if (categoryId in htmlCache) {
    return htmlCache[categoryId] || null;
  }

  // Look for the markdown file
  const path = `/database/${categoryId}/description.md`;
  const content = markdownModules[path];

  if (typeof content !== "string") {
    htmlCache[categoryId] = "";
    return null;
  }

  // Parse markdown to HTML
  const html = marked.parse(content, { async: false }) as string;
  htmlCache[categoryId] = html;

  return html;
}

/**
 * Check if a category has a description markdown file
 */
export function hasDescription(categoryId: string): boolean {
  const path = `/database/${categoryId}/description.md`;
  return path in markdownModules;
}
