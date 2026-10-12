export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className ? `icon ${className}` : 'icon'} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}
