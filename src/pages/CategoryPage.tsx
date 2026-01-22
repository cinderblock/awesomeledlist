import { useParams, Link, useSearchParams } from "react-router-dom";
import { CATEGORIES } from "@/lib/types";
import { getCategoryData } from "@/lib/data";
import { getCategoryDescription } from "@/lib/markdown";
import { getColumnsForCategory, getSearchKeysForCategory } from "@/lib/columns";
import { getTileFieldsForCategory } from "@/lib/tile-fields";
import { DataTable, TileView } from "@/components/data";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { useViewPreference, usePageTitle } from "@/hooks";

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = CATEGORIES.find((c) => c.path === `/${categoryId}`);

  // Get stored preference, but URL param takes precedence
  const urlView = searchParams.get("view");
  const [storedView, setStoredView] = useViewPreference(categoryId || "", urlView);

  usePageTitle(category?.name);

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Category not found</h1>
        <Link to="/" className="text-primary hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  const data = getCategoryData(category.id);
  const columns = getColumnsForCategory(category.id);
  const tileFields = getTileFieldsForCategory(category.id);
  const searchKeys = getSearchKeysForCategory(category.id);
  const descriptionHtml = getCategoryDescription(category.id);

  const supportsViews = category.viewType === "both";
  const currentView = urlView || storedView;

  const setView = (view: string) => {
    // Save preference to localStorage
    setStoredView(view);

    // Update URL params
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (view === "table") {
        next.delete("view");
      } else {
        next.set("view", view);
      }
      return next;
    });
  };

  return (
    <div
      className="category-theme min-h-[calc(100vh-7rem)]"
      style={{
        "--category-hue": category.color.hue,
        backgroundColor: "var(--category-bg-subtle)",
      } as React.CSSProperties}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <Link to="/" className="text-muted-foreground hover:text-foreground text-sm">
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm" style={{ color: "var(--category-primary)" }}>
              {category.name}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1
                className="mb-2 text-3xl font-bold"
                style={{ color: "var(--category-primary)" }}
              >
                {category.name}
              </h1>
              {descriptionHtml ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              ) : (
                <p className="text-muted-foreground">{category.description}</p>
              )}
            </div>
            {supportsViews && (
              <div
                className="flex gap-1 rounded-md p-1 shrink-0"
                style={{
                  borderColor: "var(--category-border)",
                  borderWidth: "1px",
                }}
              >
                <Button
                  variant={currentView === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("table")}
                  className="h-8 px-2"
                  title="Table view"
                  style={
                    currentView === "table"
                      ? {
                          backgroundColor: "var(--category-accent)",
                          color: "var(--category-accent-foreground)",
                        }
                      : undefined
                  }
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={currentView === "tile" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("tile")}
                  className="h-8 px-2"
                  title="Tile view"
                  style={
                    currentView === "tile"
                      ? {
                          backgroundColor: "var(--category-accent)",
                          color: "var(--category-accent-foreground)",
                        }
                      : undefined
                  }
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {currentView === "tile" && supportsViews ? (
          <TileView
            data={data}
            fields={tileFields}
            categoryPath={category.path}
            categoryId={category.id}
            categoryName={category.name}
            searchKeys={searchKeys}
          />
        ) : (
          <DataTable
            data={data}
            columns={columns}
            categoryPath={category.path}
            categoryId={category.id}
            categoryName={category.name}
            searchKeys={searchKeys}
          />
        )}
      </div>
    </div>
  );
}
