import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowLeft } from "lucide-react";
import type { BaseEntry } from "@/lib/data";

export interface DetailField {
  key: string;
  label: string;
  render?: (value: unknown) => React.ReactNode;
}

interface DetailPageProps<T extends BaseEntry> {
  item: T;
  fields: DetailField[];
  categoryName: string;
  categoryPath: string;
}

export function DetailPage<T extends BaseEntry>({
  item,
  fields,
  categoryName,
  categoryPath,
}: DetailPageProps<T>) {
  const getValue = (key: string): unknown => {
    const parts = key.split(".");
    let value: unknown = item;
    for (const part of parts) {
      if (value == null) return null;
      value = (value as Record<string, unknown>)[part];
    }
    return value;
  };

  const manufacturer = typeof item.manufacturer === "string" ? item.manufacturer : null;
  const notes = typeof item.notes === "string" ? item.notes : null;
  const url = typeof item.url === "string" ? item.url : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Link to="/" className="text-muted-foreground hover:text-foreground text-sm">
            Home
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link to={categoryPath} className="text-muted-foreground hover:text-foreground text-sm">
            {categoryName}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm">{item.name}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{item.name}</h1>
            {manufacturer && <p className="text-muted-foreground mt-1">by {manufacturer}</p>}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={categoryPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to list
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {fields.map((field) => {
                const value = getValue(field.key);
                if (value == null) return null;

                return (
                  <div key={field.key} className="grid grid-cols-3 gap-2">
                    <dt className="text-muted-foreground font-medium">{field.label}</dt>
                    <dd className="col-span-2">
                      {field.render ? field.render(value) : <FieldValue value={value} />}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>

        {(notes || url) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notes && (
                <div>
                  <h4 className="text-muted-foreground mb-1 text-sm font-medium">Notes</h4>
                  <p className="text-sm">{notes}</p>
                </div>
              )}
              {url && (
                <div>
                  <h4 className="text-muted-foreground mb-1 text-sm font-medium">Product Link</h4>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                  >
                    Visit product page
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function FieldValue({ value }: { value: unknown }) {
  if (typeof value === "boolean") {
    return value ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => (
          <Badge key={i} variant="outline">
            {String(v)}
          </Badge>
        ))}
      </div>
    );
  }

  if (typeof value === "string" && value.startsWith("http")) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary inline-flex items-center gap-1 hover:underline"
      >
        Link
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return <span>{String(value)}</span>;
}
