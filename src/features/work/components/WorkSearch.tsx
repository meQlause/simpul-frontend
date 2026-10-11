import { useState, useEffect } from 'react';
import { useOnline } from '../../../shared/useOnline';
import { workCopy as copy } from '../work.copy';

const searchDelay = 250;

export function WorkSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState(value);
  const online = useOnline();

  useEffect(() => {
    if (search === value) {
      return;
    }

    const timer = setTimeout(() => onChange(search), searchDelay);

    return () => clearTimeout(timer);
  }, [search, value, onChange]);

  return (
    <input
      type="search"
      aria-label="Search work"
      placeholder={copy.search}
      value={search}
      disabled={!online}
      onChange={(event) => setSearch(event.target.value)}
    />
  );
}
