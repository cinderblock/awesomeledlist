import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/types";

export function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">Awesome LED List</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          A comprehensive reference for addressable LED controllers, pixels, ICs, and related
          products. Browse categories below or use the search to find what you need.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.map((category) => (
          <Link key={category.id} to={category.path}>
            <Card className="hover:bg-muted/50 h-full transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
