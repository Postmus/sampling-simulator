const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function svgElement<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NAMESPACE, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

export function clearSvg(element: Element) {
  element.replaceChildren();
}

export function appendSvgText(
  parent: SVGElement,
  text: string,
  x: number,
  y: number,
  className: string,
  anchor: "start" | "middle" | "end" = "start",
) {
  const node = svgElement("text", { x, y, class: className, "text-anchor": anchor });
  node.textContent = text;
  parent.append(node);
  return node;
}
