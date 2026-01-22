import { useMemo, useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageCell } from "@/components/ui/image-cell";
import { RainbowText } from "@/components/RainbowText";
import { CATEGORIES, type Category } from "@/lib/types";
import { getCategoryCount, getRandomEntriesWithImages, getImageUrl } from "@/lib/data";
import { usePageTitle } from "@/hooks";
import { useCategoryAnimation } from "@/context";

interface ExpandingCard {
  category: Category;
  rect: DOMRect;
}

export function Home() {
  usePageTitle(); // Use default title
  const navigate = useNavigate();
  const { registerCardRef, triggerAnimation } = useCategoryAnimation();
  const [expandingCard, setExpandingCard] = useState<ExpandingCard | null>(null);

  // Clear animation state after a short delay to allow animation to play
  // but ensure cards are clickable when user returns via back button
  useEffect(() => {
    if (expandingCard) {
      const timer = setTimeout(() => {
        setExpandingCard(null);
      }, 500); // Clear after animation completes
      return () => clearTimeout(timer);
    }
  }, [expandingCard]);

  const totalEntries = CATEGORIES.reduce((sum, cat) => sum + getCategoryCount(cat.id), 0);

  // Get random entries with images for preview (memoized to persist during render)
  const categoryPreviews = useMemo(() => {
    const previews: Record<string, { name: string; image: string }[]> = {};
    for (const cat of CATEGORIES) {
      const entries = getRandomEntriesWithImages(cat.id, 3);
      previews[cat.id] = entries
        .map((e) => {
          const img = e.image || (e.images && e.images[0]);
          if (!img) return null;
          return { name: e.name, image: getImageUrl(cat.id, img) };
        })
        .filter(Boolean) as { name: string; image: string }[];
    }
    return previews;
  }, []);

  const handleCardClick = useCallback(
    (e: React.MouseEvent, category: Category) => {
      e.preventDefault();

      const cardRect = triggerAnimation(category.id);
      if (cardRect) {
        setExpandingCard({
          category,
          rect: cardRect.rect,
        });

        // Navigate after animation starts
        setTimeout(() => {
          navigate(category.path);
        }, 150);
      } else {
        // Fallback if no rect found
        navigate(category.path);
      }
    },
    [triggerAnimation, navigate]
  );

  return (
    <>
      {/* Expanding card overlay */}
      {expandingCard && (
        <div className="pointer-events-none fixed inset-0 z-[100]">
          <div
            className="expanding-card absolute flex items-center justify-center rounded-lg text-xl font-bold"
            style={
              {
                "--start-x": `${expandingCard.rect.left}px`,
                "--start-y": `${expandingCard.rect.top}px`,
                "--start-width": `${expandingCard.rect.width}px`,
                "--start-height": `${expandingCard.rect.height}px`,
                "--card-hue": expandingCard.category.color.hue,
              } as React.CSSProperties
            }
          >
            {expandingCard.category.name}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            <RainbowText>Awesome LED List</RainbowText>
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            A comprehensive reference for addressable LED controllers, pixels, ICs, and related
            products. Browse categories below or use the search to find what you need.
          </p>
          <p className="text-muted-foreground mt-2">
            <Badge variant="secondary" className="text-sm">
              {totalEntries.toLocaleString()} entries
            </Badge>{" "}
            across {CATEGORIES.length} categories
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((category) => {
            const count = getCategoryCount(category.id);
            const previews = categoryPreviews[category.id] || [];
            const isExpanding = expandingCard?.category.id === category.id;

            return (
              <a
                key={category.id}
                href={category.path}
                onClick={(e) => handleCardClick(e, category)}
                ref={(el) => registerCardRef(category.id, el)}
                data-category-card={category.id}
                className={expandingCard ? "pointer-events-none" : ""}
                style={{
                  "--card-hue": category.color.hue,
                } as React.CSSProperties}
              >
                <Card
                  className={`category-card h-full overflow-hidden ${isExpanding ? "opacity-0" : ""}`}
                >
                  {previews.length > 0 && (
                    <div className="flex h-24 gap-0.5 overflow-hidden">
                      {previews.slice(0, 3).map((preview, idx) => (
                        <ImageCell
                          key={idx}
                          src={preview.image}
                          alt={preview.name}
                          className="h-full flex-1"
                          fallbackClassName="h-full flex-1"
                        />
                      ))}
                    </div>
                  )}
                  <CardHeader className={previews.length > 0 ? "pt-3 pb-2" : "pb-2"}>
                    <div className="flex items-start justify-between">
                      <CardTitle className="card-title text-lg">{category.name}</CardTitle>
                      <Badge variant="outline" className="card-badge">
                        {count}
                      </Badge>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="card-link text-sm hover:underline">Browse &rarr;</span>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}
