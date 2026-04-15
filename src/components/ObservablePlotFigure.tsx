import { useEffect, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";

interface ObservablePlotFigureProps {
  options: Plot.PlotOptions;
  className?: string;
}

export function ObservablePlotFigure({ options, className }: ObservablePlotFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const updateWidth = () => {
      const nextWidth = Math.floor(container.getBoundingClientRect().width);
      setContainerWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || containerWidth === 0) {
      return undefined;
    }

    const plot = Plot.plot({
      ...options,
      width: containerWidth,
    });
    container.replaceChildren(plot);

    return () => {
      plot.remove();
    };
  }, [containerWidth, options]);

  return <div ref={containerRef} className={className ? `plot-host ${className}` : "plot-host"} />;
}
