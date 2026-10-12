// In-page measurement of the mockup (and later the app): the text and box signatures of
// everything visible. Serialised into the page, so it uses nothing from this module.

export type Rect = { x: number; y: number; width: number; height: number };

export type Measured = {
  texts: string[];
  boxes: { classes: string[]; signature: string }[];
  regions: Record<string, Rect>;
};

export function measure(): Measured {
  const isVisible = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const shown = style.visibility !== 'hidden' && style.display !== 'none';

    return rect.width > 0 && rect.height > 0 && shown;
  };

  const rectOf = (element: Element): Rect => {
    const rect = element.getBoundingClientRect();

    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  };

  // Elements the product drops or rewrites on purpose (fidelity.md §11) are masked in the app run.
  const named: [string, string][] = [
    ['sidebar', '.sidebar'],
    ['topbar', '.topbar'],
    ['content', '#page-content'],
    ['drawer', '#detail-dialog[open]'],
    ['heading-actions', '.heading-actions'],
    ['avatar-stack', '.avatar-stack'],
    ['preview-states', '.mockup-states'],
    ['state-copy', '.screen-state > p'],
    ['state-action', '.screen-state > .button'],
  ];
  const marker = /\b(demo|sample|simulate)\b/i;
  const regionsOf = (): Record<string, Rect> => {
    const regions: Record<string, Rect> = {};

    for (const [name, selector] of named) {
      const element = document.querySelector(selector);

      if (element && isVisible(element)) {
        regions[name] = rectOf(element);
      }
    }

    // Every element whose own text carries a demo marker (FD-02, FD-03, FD-04).
    const marked = [...document.querySelectorAll('body *')].filter(
      (element) =>
        isVisible(element) &&
        [...element.childNodes].some(
          (node) => node.nodeType === Node.TEXT_NODE && marker.test(node.textContent ?? ''),
        ),
    );

    marked.forEach((element, index) => {
      regions[`demo-text-${index}`] = rectOf(element);
    });

    return regions;
  };

  const hasOwnText = (element: Element) =>
    [...element.childNodes].some(
      (node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
    );
  const textSignature = (style: CSSStyleDeclaration) =>
    [
      style.fontFamily.split(',')[0].replace(/['"]/g, ''),
      style.fontSize,
      style.fontWeight,
      style.lineHeight,
      style.letterSpacing,
      style.textTransform,
      style.color,
    ].join('|');
  const boxSignature = (style: CSSStyleDeclaration) =>
    [
      style.paddingTop,
      style.paddingRight,
      style.paddingBottom,
      style.paddingLeft,
      style.borderTopLeftRadius,
      style.borderTopWidth,
      style.fontSize,
      style.fontWeight,
      style.backgroundColor,
      style.color,
    ].join('|');
  const selectors = ['.sidebar', '.topbar', '#page-content', '#detail-dialog[open]', '#toast'];
  const roots = selectors
    .map((selector) => document.querySelector(selector))
    .filter((element): element is Element => element !== null && isVisible(element));
  const elements = roots.flatMap((root) => [...root.querySelectorAll('*')]).filter(isVisible);
  const texts = elements
    .filter(hasOwnText)
    .map((element) => textSignature(getComputedStyle(element)));
  const boxes = elements
    .filter((element) => element.classList.length > 0)
    .map((element) => ({
      classes: [...element.classList],
      signature: boxSignature(getComputedStyle(element)),
    }));

  const regions = regionsOf();

  return { texts, boxes, regions };
}
