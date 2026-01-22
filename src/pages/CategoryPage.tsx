import { useParams, Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/types";
import { getCategoryData } from "@/lib/data";
import { getColumnsForCategory, getSearchKeysForCategory } from "@/lib/columns";
import { DataTable } from "@/components/data";

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = CATEGORIES.find((c) => c.path === `/${categoryId}`);

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
  const searchKeys = getSearchKeysForCategory(category.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Link to="/" className="text-muted-foreground hover:text-foreground text-sm">
            Home
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm">{category.name}</span>
        </div>
        <h1 className="mb-2 text-3xl font-bold">{category.name}</h1>
        <p className="text-muted-foreground">{category.description}</p>
      </div>

      <DataTable
        data={data}
        columns={columns}
        categoryPath={category.path}
        searchKeys={searchKeys}
      />
    </div>
  );
}
