export default function BrandLogo({ className = '' }) {
  return (
    <span
      className={`inline-block flex-shrink-0 overflow-hidden rounded border border-[#c6a253]/50 bg-[#c6a253] ${className}`}
      style={{
        backgroundImage: "url('/images/AGL%20LOGO.jpeg')",
        backgroundSize: '500% auto',
        backgroundPosition: '50% 42%',
      }}
      role="img"
      aria-label="AGL Africa Global Logistics"
    />
  );
}