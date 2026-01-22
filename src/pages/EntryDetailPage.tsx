import { useParams, Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/types";
import { getEntryById } from "@/lib/data";
import { getFieldsForCategory } from "@/lib/fields";
import { DetailPage } from "@/components/data";

export function EntryDetailPage() {
  const { categoryId, entryId } = useParams<{ categoryId: string; entryId: string }>();
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

  const entry = entryId ? getEntryById(category.id, entryId) : undefined;

  if (!entry) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Entry not found</h1>
        <Link to={category.path} className="text-primary hover:underline">
          Return to {category.name}
        </Link>
      </div>
    );
  }

  const fields = getFieldsForCategory(category.id);

  return (
    <DetailPage
      item={entry}
      fields={fields}
      categoryName={category.name}
      categoryPath={category.path}
    />
  );
}
