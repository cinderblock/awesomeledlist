import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/types";
import { getCategoryCount } from "@/lib/data";
import { usePageTitle } from "@/hooks";

export function Home() {
  usePageTitle(); // Use default title

  const totalEntries = CATEGORIES.reduce((sum, cat) => sum + getCategoryCount(cat.id), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">Awesome LED List</h1>
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
          return (
            <Link key={category.id} to={category.path}>
              <Card className="hover:bg-muted/50 h-full transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-primary text-sm hover:underline">Browse &rarr;</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
