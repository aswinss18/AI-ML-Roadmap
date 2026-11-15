export function BrandMark({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M5 31 16.2 8h7.1L12.1 31H5Z" fill="currentColor" />
      <path
        d="m24.5 11.2 10.5 19.8h-8.1l-6.4-12.1 4-7.7Z"
        fill="currentColor"
      />
      <path d="M16.1 27.2h6.5l2 3.8H14.3l1.8-3.8Z" fill="currentColor" />
    </svg>
  );
}
