import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  className = "h-12 w-36",
  imageClassName = "object-contain",
  priority = false,
}: BrandLogoProps) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`}>
      <Image
        src="/logo_cool_voyage.png"
        alt="Cool Voyage"
        fill
        sizes="180px"
        priority={priority}
        className={imageClassName}
      />
    </span>
  );
}
