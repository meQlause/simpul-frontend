// The loading state's stand-in (FR-UI-18): blocks in the shape of what is about to appear, hidden
// from assistive technology. The container that names the state is ScreenState's.
const ROWS = 6;
const CARDS = 4;
const SECTIONS = 3;

const SHAPES = {
  table: ['heading', 'toolbar', ...Array.from({ length: ROWS }, () => 'row')],
  cards: Array.from({ length: CARDS }, () => 'card'),
  drawer: ['identity', ...Array.from({ length: SECTIONS }, () => 'section')],
};

export function Skeleton({ variant, grid }: { variant: keyof typeof SHAPES; grid?: string }) {
  return (
    <div
      className={['skeleton', `skeleton-${variant}`, grid].filter(Boolean).join(' ')}
      data-component="Skeleton"
      data-variant={variant}
      aria-hidden="true"
    >
      {SHAPES[variant].map((block, index) => (
        <span key={`${block}-${index}`} className={`skeleton-block skeleton-${block}`} />
      ))}
    </div>
  );
}
