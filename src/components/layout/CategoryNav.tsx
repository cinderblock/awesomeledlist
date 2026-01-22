import { useRef, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryNavProps {
  className?: string;
}

export function CategoryNav({ className }: CategoryNavProps) {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const isHome = location.pathname === "/" || location.pathname === "";

  // Get current category from path
  const currentCategory = CATEGORIES.find(
    (cat) => location.pathname === cat.path || location.pathname.startsWith(cat.path + "/")
  );

  // Check scroll position to show/hide arrows
  const updateScrollArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    updateScrollArrows();
    window.addEventListener("resize", updateScrollArrows);
    return () => window.removeEventListener("resize", updateScrollArrows);
  }, []);

  // Scroll active tab into view
  useEffect(() => {
    if (currentCategory && scrollRef.current) {
      const activeTab = scrollRef.current.querySelector(`[data-category="${currentCategory.id}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [currentCategory]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <nav
      className={cn(
        "relative flex items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isHome ? "category-nav-hidden" : "category-nav-visible",
        className
      )}
    >
      {/* Left scroll arrow */}
      <button
        onClick={() => scroll("left")}
        className={cn(
          "absolute left-0 z-10 flex h-full w-8 items-center justify-center bg-gradient-to-r from-background to-transparent transition-opacity",
          showLeftArrow ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Scrollable tabs container */}
      <div
        ref={scrollRef}
        onScroll={updateScrollArrows}
        className="scrollbar-hide mx-auto flex overflow-x-auto px-4"
      >
        <div className="mx-auto flex gap-1 py-1">
          {CATEGORIES.map((category, index) => {
            const isActive = currentCategory?.id === category.id;
            return (
              <Link
                key={category.id}
                to={category.path}
                data-category={category.id}
                className={cn(
                  "category-tab whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  "hover:bg-muted hover:text-foreground",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
                style={{
                  "--tab-index": index,
                } as React.CSSProperties}
              >
                {category.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right scroll arrow */}
      <button
        onClick={() => scroll("right")}
        className={cn(
          "absolute right-0 z-10 flex h-full w-8 items-center justify-center bg-gradient-to-l from-background to-transparent transition-opacity",
          showRightArrow ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
