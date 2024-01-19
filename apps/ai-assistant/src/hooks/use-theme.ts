import { useEffect, useMemo, useState } from 'react';

function useMedia(query: string) {
  const media = useMemo(() => matchMedia(query), [query]);
  const [matches, setMatches] = useState(media.matches);

  useEffect(() => {
    const syncState = () => setMatches(media.matches);
    syncState();
    media.addEventListener('change', syncState);
    return () => media.removeEventListener('change', syncState);
  }, [media]);

  return matches;
}

export function useSemiTheme() {
  const isDark = useMedia('(prefers-color-scheme: dark)');

  useEffect(() => {
    document.body.setAttribute('theme-mode', isDark ? 'dark' : 'light');
  }, [isDark]);
}
