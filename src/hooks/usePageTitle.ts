import { useEffect } from "react";

const BASE_TITLE = "Awesome LED List";

export function usePageTitle(title?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
