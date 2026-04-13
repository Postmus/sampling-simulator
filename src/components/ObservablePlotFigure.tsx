import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

interface ObservablePlotFigureProps {
  options: Plot.PlotOptions;
}

export function ObservablePlotFigure({ options }: ObservablePlotFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const plot = Plot.plot(options);
    container.replaceChildren(plot);

    return () => {
      plot.remove();
    };
  }, [options]);

  return <div ref={containerRef} className="plot-host" />;
}
