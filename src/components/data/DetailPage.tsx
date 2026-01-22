import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "@/components/ui/image-cell";
import { ExternalLink, ArrowLeft, FileText, ShoppingCart, Youtube, Link2 } from "lucide-react";
import type { BaseEntry } from "@/lib/data";
import {
  getImageUrl,
  getRelatedItemConfigs,
  getRelatedEntries,
  getReferencingEntries,
} from "@/lib/data";
import { CATEGORIES } from "@/lib/types";

// Link types that can appear on detail pages
interface ExternalLinkInfo {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const linkTypes: ExternalLinkInfo[] = [
  { key: "url", label: "Product page", icon: <ExternalLink className="h-4 w-4" /> },
  { key: "datasheet_url", label: "Datasheet", icon: <FileText className="h-4 w-4" /> },
  { key: "digikey_url", label: "DigiKey", icon: <ShoppingCart className="h-4 w-4" /> },
  { key: "mouser_url", label: "Mouser", icon: <ShoppingCart className="h-4 w-4" /> },
  { key: "youtube_url", label: "YouTube", icon: <Youtube className="h-4 w-4" /> },
];

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
  categoryId: string;
}

export function DetailPage<T extends BaseEntry>({
  item,
  fields,
  categoryName,
  categoryPath,
  categoryId,
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
  const technicalNotes = Array.isArray(item.technical_notes) ? item.technical_notes : null;
  const datasheetDiscrepancies = Array.isArray(item.datasheet_discrepancies)
    ? item.datasheet_discrepancies
    : null;
  const priceTiers = Array.isArray(item.price_tiers) ? item.price_tiers : null;
  const variants = Array.isArray(item.variants) ? item.variants : null;

  // Collect all available external links
  const availableLinks = linkTypes
    .map((linkType) => {
      const value = item[linkType.key];
      if (typeof value !== "string" || !value.startsWith("http")) return null;
      return { ...linkType, url: value };
    })
    .filter(Boolean) as (ExternalLinkInfo & { url: string })[];

  // Collect images
  const images: string[] = [];
  if (item.image) {
    images.push(getImageUrl(categoryId, item.image));
  }
  if (item.images) {
    for (const img of item.images) {
      const url = getImageUrl(categoryId, img);
      if (!images.includes(url)) {
        images.push(url);
      }
    }
  }

  // Get related items
  const relatedItemConfigs = getRelatedItemConfigs(categoryId);
  const relatedItems = useMemo(() => {
    return relatedItemConfigs
      .map((config) => ({
        label: config.label,
        entries: getRelatedEntries(item, config),
      }))
      .filter((group) => group.entries.length > 0);
  }, [item, relatedItemConfigs]);

  // Get items that reference this entry
  const referencingItems = useMemo(() => {
    const refs = getReferencingEntries(item.id, categoryId);
    if (refs.length === 0) return [];

    // Group by source category
    const grouped: Record<string, { entry: BaseEntry; sourcePath: string }[]> = {};
    for (const ref of refs) {
      if (!grouped[ref.sourceCategory]) {
        grouped[ref.sourceCategory] = [];
      }
      grouped[ref.sourceCategory]!.push({ entry: ref.entry, sourcePath: ref.sourcePath });
    }

    return Object.entries(grouped).map(([catId, items]) => {
      const cat = CATEGORIES.find((c) => c.id === catId);
      return {
        categoryName: cat?.name || catId,
        items,
      };
    });
  }, [item.id, categoryId]);

  const hasRelatedItems = relatedItems.length > 0 || referencingItems.length > 0;

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
        {images.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageGallery images={images} alt={item.name} className="max-w-2xl" />
            </CardContent>
          </Card>
        )}

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

        {(notes || technicalNotes || datasheetDiscrepancies || availableLinks.length > 0) && (
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
              {technicalNotes && technicalNotes.length > 0 && (
                <div>
                  <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                    Technical Notes
                  </h4>
                  <ul className="list-disc space-y-1 pl-4">
                    {technicalNotes.map((note, i) => (
                      <li key={i} className="text-sm">
                        {String(note)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {datasheetDiscrepancies && datasheetDiscrepancies.length > 0 && (
                <div>
                  <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                    Datasheet Discrepancies
                  </h4>
                  <ul className="list-disc space-y-1 pl-4">
                    {datasheetDiscrepancies.map((note, i) => (
                      <li key={i} className="text-sm text-amber-600 dark:text-amber-400">
                        {String(note)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {availableLinks.length > 0 && (
                <div>
                  <h4 className="text-muted-foreground mb-2 text-sm font-medium">External Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableLinks.map((link) => (
                      <a
                        key={link.key}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary bg-muted hover:bg-muted/80 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors"
                      >
                        {link.icon}
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {priceTiers && priceTiers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priceTiers.map((tier, i) => (
                  <div key={i} className="bg-muted/50 rounded-md p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium">
                        {tier.tier || tier.pixels || `Tier ${i + 1}`}
                      </span>
                      <Badge variant="outline">{tier.price}</Badge>
                    </div>
                    {tier.features && (
                      <p className="text-muted-foreground text-sm">{tier.features}</p>
                    )}
                    {tier.limitations && (
                      <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                        {tier.limitations}
                      </p>
                    )}
                    {tier.notes && (
                      <p className="text-muted-foreground mt-1 text-sm">{tier.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {variants && variants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {variants.map((variant, i) => (
                  <div key={i} className="bg-muted/50 rounded-md p-3">
                    <span className="font-medium">{variant.name || variant.suffix}</span>
                    {variant.differences && (
                      <p className="text-muted-foreground mt-1 text-sm">{variant.differences}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {hasRelatedItems && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Related Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {relatedItems.map((group) => (
                <div key={group.label}>
                  <h4 className="text-muted-foreground mb-2 text-sm font-medium">{group.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.entries.map((entry) => (
                      <Link
                        key={entry.id}
                        to={`${entry.categoryPath}/${entry.id}`}
                        className="text-primary bg-muted hover:bg-muted/80 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors"
                      >
                        {entry.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {referencingItems.map((group) => (
                <div key={group.categoryName}>
                  <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                    Used by {group.categoryName}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.entry.id}
                        to={`${item.sourcePath}/${item.entry.id}`}
                        className="text-primary bg-muted hover:bg-muted/80 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors"
                      >
                        {item.entry.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
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
    // Check if array contains objects (like price_tiers or variants)
    if (value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
      return <ObjectArrayValue items={value as Record<string, unknown>[]} />;
    }
    // Simple string array
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

// Render array of objects (like price_tiers, variants)
function ObjectArrayValue({ items }: { items: Record<string, unknown>[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="bg-muted/50 rounded-md p-2 text-sm">
          {Object.entries(item)
            .filter(([, v]) => v != null)
            .map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>
                <span>{String(v)}</span>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
