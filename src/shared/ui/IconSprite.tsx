const sprite = (
  <svg className="svg-library" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <symbol id="i-grid" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </symbol>
      <symbol id="i-layers" viewBox="0 0 24 24">
        <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
      </symbol>
      <symbol id="i-inbox" viewBox="0 0 24 24">
        <path d="M4 4h16l2 12v4H2v-4L4 4Zm-2 12h6l2 3h4l2-3h6" />
      </symbol>
      <symbol id="i-route" viewBox="0 0 24 24">
        <circle cx="6" cy="5" r="2" />
        <circle cx="18" cy="19" r="2" />
        <path d="M6 7v8a4 4 0 0 0 4 4h6M8 5h5a4 4 0 0 1 0 8H9m7-3 3 3-3 3" />
      </symbol>
      <symbol id="i-users" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="3.5" />
        <path d="M2 21v-3a6 6 0 0 1 12 0v3M16 4a3.5 3.5 0 0 1 0 7m2 3a5 5 0 0 1 4 5v2" />
      </symbol>
      <symbol id="i-telegram" viewBox="0 0 24 24">
        <path d="m21 3-4 18-6-5-4 3 1-6-6-3L21 3Z" />
        <path d="m8 13 9-6-6 9" />
      </symbol>
      <symbol id="i-history" viewBox="0 0 24 24">
        <path d="M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v5l3 2" />
      </symbol>
      <symbol id="i-settings" viewBox="0 0 24 24">
        <path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z" />
        <circle cx="12" cy="12" r="3" />
      </symbol>
      <symbol id="i-search" viewBox="0 0 24 24">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </symbol>
      <symbol id="i-bell" viewBox="0 0 24 24">
        <path d="M18 8a6 6 0 0 0-12 0v6l-2 3h16l-2-3V8Zm-8 12h4" />
      </symbol>
      <symbol id="i-help" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 1 1 4 3v2m0 3h.01" />
      </symbol>
      <symbol id="i-chevron-down" viewBox="0 0 24 24">
        <path d="m7 10 5 5 5-5" />
      </symbol>
      <symbol id="i-chevron-right" viewBox="0 0 24 24">
        <path d="m9 6 6 6-6 6" />
      </symbol>
      <symbol id="i-chevron-left" viewBox="0 0 24 24">
        <path d="m15 6-6 6 6 6" />
      </symbol>
      <symbol id="i-arrow-up-right" viewBox="0 0 24 24">
        <path d="M6 18 18 6M6 6h12v12" />
      </symbol>
      <symbol id="i-arrow-right" viewBox="0 0 24 24">
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </symbol>
      <symbol id="i-plus" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </symbol>
      <symbol id="i-close" viewBox="0 0 24 24">
        <path d="m6 6 12 12M6 18 18 6" />
      </symbol>
      <symbol id="i-check" viewBox="0 0 24 24">
        <path d="m5 12 4 4L19 6" />
      </symbol>
      <symbol id="i-clock" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </symbol>
      <symbol id="i-filter" viewBox="0 0 24 24">
        <path d="M4 7h16M7 12h10m-7 5h4" />
      </symbol>
      <symbol id="i-sparkles" viewBox="0 0 24 24">
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Zm7-1v4m-2-2h4" />
      </symbol>
      <symbol id="i-link" viewBox="0 0 24 24">
        <path d="m10 7 3-3a5 5 0 0 1 7 7l-3 3m-3 3-3 3a5 5 0 0 1-7-7l3-3m1 6 8-8" />
      </symbol>
      <symbol id="i-shield" viewBox="0 0 24 24">
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </symbol>
      <symbol id="i-play" viewBox="0 0 24 24">
        <path d="m8 5 11 7-11 7V5Z" />
      </symbol>
      <symbol id="i-download" viewBox="0 0 24 24">
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </symbol>
      <symbol id="i-package" viewBox="0 0 24 24">
        <path d="m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10M7 4.5l10 5.5v5" />
      </symbol>
      <symbol id="i-mail" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </symbol>
      <symbol id="i-more" viewBox="0 0 24 24">
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </symbol>
      <symbol id="i-menu" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </symbol>
      <symbol id="i-logout" viewBox="0 0 24 24">
        <path d="M9 3H3v18h6m6-15 6 6-6 6M8 12h13" />
      </symbol>
      <symbol id="i-building" viewBox="0 0 24 24">
        <path d="M4 21V3h12v18M16 9h4v12M2 21h20M8 7h4M8 11h4m-4 4h4m-4 6v-3h4v3" />
      </symbol>
      <symbol id="i-activity" viewBox="0 0 24 24">
        <path d="M2 12h5l3-8 4 16 3-8h5" />
      </symbol>
      <symbol id="i-external" viewBox="0 0 24 24">
        <path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7" />
      </symbol>
      <symbol id="i-leaf" viewBox="0 0 24 24">
        <path d="M4 20 16 8M6 18C-2 5 13 2 21 3c0 9-3 20-15 15Z" />
      </symbol>
      <symbol id="i-check-circle" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </symbol>
      <symbol id="i-file" viewBox="0 0 24 24">
        <path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8m-8 4h6" />
      </symbol>
      <symbol id="i-pause" viewBox="0 0 24 24">
        <path d="M8 5v14M16 5v14" />
      </symbol>
      <symbol id="i-refresh" viewBox="0 0 24 24">
        <path d="M20 10a8 8 0 0 0-14-5L3 8m0-5v5h5M4 14a8 8 0 0 0 14 5l3-3m0 5v-5h-5" />
      </symbol>
      <symbol id="i-alert" viewBox="0 0 24 24">
        <path d="m12 3 10 18H2L12 3Zm0 6v5m0 3h.01" />
      </symbol>
      <symbol id="i-send" viewBox="0 0 24 24">
        <path d="m22 2-7 20-4-9-9-4L22 2ZM11 13 22 2" />
      </symbol>
    </defs>
  </svg>
);

export function IconSprite() {
  return sprite;
}
