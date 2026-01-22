import { useRainbow } from "@/context";

interface RainbowTextProps {
  children: string;
  className?: string;
}

export function RainbowText({ children, className = "" }: RainbowTextProps) {
  const { hue } = useRainbow();
  const letters = children.split("");
  const hueSpread = 360; // Full rainbow spread across the text

  return (
    <span className={className}>
      {letters.map((letter, index) => {
        // Calculate hue for this letter, offset by base hue
        const letterHue = (hue + (index / letters.length) * hueSpread) % 360;

        return (
          <span
            key={index}
            className="rainbow-letter"
            style={{
              "--letter-hue": letterHue,
            } as React.CSSProperties}
          >
            {letter}
          </span>
        );
      })}
    </span>
  );
}
