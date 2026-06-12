import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Check, CircleAlert, Download, Link2, Zap } from "lucide-react";
import { getCategoryData } from "@/lib/data";
import type { Controller, Pixel } from "@/lib/data";
import {
  buildDiagramSvg,
  checkCompatibility,
  estimatePower,
  powerWarningLevel,
} from "@/lib/wizard";
import { usePageTitle } from "@/hooks";

export function WizardPage() {
  usePageTitle("System Wizard");
  const [params, setParams] = useSearchParams();

  const pixels = useMemo(
    () => [...getCategoryData<Pixel>("pixels")].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );
  const controllers = useMemo(
    () =>
      [...getCategoryData<Controller>("controllers")].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    []
  );

  const pixel = pixels.find((p) => p.id === params.get("pixel"));
  const controller = controllers.find((c) => c.id === params.get("controller"));
  const count = Math.max(1, Math.min(1_000_000, Number(params.get("n")) || 100));

  const update = (key: string, value: string) => {
    setParams(
      (prev) => {
        if (value) prev.set(key, value);
        else prev.delete(key);
        return prev;
      },
      { replace: true }
    );
  };

  const power = pixel ? estimatePower(pixel, count) : null;
  const warning = power ? powerWarningLevel(power.totalWatts) : "none";
  const checks = pixel && controller ? checkCompatibility(pixel, controller, count) : [];

  const downloadSvg = () => {
    if (!pixel || !controller || !power) return;
    const svg = buildDiagramSvg({
      pixel,
      controller,
      count,
      power,
      shareUrl: window.location.href,
    });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `led-system-${pixel.id}-${controller.id}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyLink = () => navigator.clipboard.writeText(window.location.href);

  const checkIcon = {
    ok: <Check className="h-4 w-4 shrink-0 text-emerald-600" />,
    warn: <CircleAlert className="h-4 w-4 shrink-0 text-amber-600" />,
    error: <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />,
  } as const;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Design My System</h1>
        <p className="text-muted-foreground text-sm">
          Pick pixels and a controller; the wizard checks compatibility, estimates power, and
          makes a shareable diagram. The URL always encodes your selection.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Parts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Pixels</label>
            <Select value={pixel?.id ?? ""} onValueChange={(v) => update("pixel", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose pixels" />
              </SelectTrigger>
              <SelectContent>
                {pixels.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">How many</label>
            <Input
              type="number"
              min={1}
              max={1_000_000}
              value={count}
              onChange={(e) => update("n", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Controller</label>
            <Select value={controller?.id ?? ""} onValueChange={(v) => update("controller", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a controller" />
              </SelectTrigger>
              <SelectContent>
                {controllers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {checks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {checks.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  {checkIcon[c.level]}
                  <span>{c.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {power && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> 3. Power (at full white)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Per pixel</dt>
                <dd className="font-medium tabular-nums">
                  {power.perPixelMw} mW{power.estimated && " (est.)"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-medium tabular-nums">{power.totalWatts.toFixed(1)} W</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  Current @ {power.volts}V{!power.voltsKnown && " (assumed)"}
                </dt>
                <dd className="font-medium tabular-nums">{power.amps.toFixed(1)} A</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Suggested PSU</dt>
                <dd className="font-medium tabular-nums">{power.recommendedPsuWatts} W</dd>
              </div>
            </dl>

            {power.amps > 10 && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Over 10 A on one run - plan power injection at multiple points and size your
                wiring accordingly.
              </p>
            )}
            {warning === "advisory" && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Above ~20 W things start to matter: fuse your supply lines and double-check wire
                gauge. When in doubt, ask experienced builders.
              </p>
            )}
            {warning === "serious" && (
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Above ~200 W this is a serious power system. Mistakes can start fires - please
                consult someone experienced with high-power LED installations before building.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {pixel && controller && power && (
        <Card>
          <CardHeader>
            <CardTitle>4. Share it</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="overflow-x-auto rounded-md border bg-white"
              dangerouslySetInnerHTML={{
                __html: buildDiagramSvg({
                  pixel,
                  controller,
                  count,
                  power,
                  shareUrl: window.location.href,
                }),
              }}
            />
            <div className="flex gap-2">
              <Button onClick={downloadSvg} variant="default" size="sm">
                <Download /> Download SVG
              </Button>
              <Button onClick={copyLink} variant="outline" size="sm">
                <Link2 /> Copy share link
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              The SVG embeds your selection as JSON metadata, so the file itself carries its
              source - like a draw.io diagram.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
