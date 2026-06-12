import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Check, CircleAlert, Download, Image, Link2, Zap } from "lucide-react";
import { getCategoryData } from "@/lib/data";
import type { Controller, Pixel } from "@/lib/data";
import {
  buildDiagramSvg,
  checkCompatibility,
  estimatePower,
  injectionIntervalPx,
  powerWarningLevel,
  rankControllers,
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
  const injectEvery = power ? injectionIntervalPx(power) : null;

  // With pixels chosen, group the controller list: hard-compatible first
  const ranking = useMemo(
    () => (pixel ? rankControllers(pixel, count, controllers) : null),
    [pixel, count, controllers]
  );

  const needsShifter = checks.some((c) => c.link?.label === "74AHCT125");

  const diagramSvg = () =>
    pixel && controller && power
      ? buildDiagramSvg({
          pixel,
          controller,
          count,
          power,
          shareUrl: window.location.href,
          needsShifter,
          injectEvery,
        })
      : null;

  const downloadBlob = (blob: Blob, name: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadSvg = () => {
    const svg = diagramSvg();
    if (!svg || !pixel || !controller) return;
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `led-system-${pixel.id}-${controller.id}.svg`);
  };

  const downloadPng = () => {
    const svg = diagramSvg();
    if (!svg || !pixel || !controller) return;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = new window.Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `led-system-${pixel.id}-${controller.id}.png`);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
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
            {pixel && (
              <Link
                to={`/pixels/${pixel.id}`}
                className="text-primary text-xs hover:underline"
              >
                View {pixel.name} details
              </Link>
            )}
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
                {ranking ? (
                  <>
                    <SelectGroup>
                      <SelectLabel>
                        Compatible ({ranking.compatible.length})
                      </SelectLabel>
                      {ranking.compatible.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {ranking.other.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Incompatible or unverified</SelectLabel>
                        {ranking.other.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </>
                ) : (
                  controllers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {controller && (
              <Link
                to={`/controllers/${controller.id}`}
                className="text-primary text-xs hover:underline"
              >
                View {controller.name} details
              </Link>
            )}
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
                  <span>
                    {c.message}
                    {c.link && (
                      <>
                        {" "}
                        <Link to={c.link.to} className="text-primary hover:underline">
                          {c.link.label}
                        </Link>
                      </>
                    )}
                  </span>
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

            {injectEvery != null && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Over 10 A total - plan a power feed roughly every{" "}
                {injectEvery.toLocaleString()} pixels (keeping each feed under 10 A) and size
                your wiring accordingly.
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
              dangerouslySetInnerHTML={{ __html: diagramSvg() ?? "" }}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadSvg} variant="default" size="sm">
                <Download /> Download SVG
              </Button>
              <Button onClick={downloadPng} variant="outline" size="sm">
                <Image /> Download PNG
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
