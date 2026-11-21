import Image from "next/image";

const portraits = {
  genie: "/brand/genie-avatar.webp",
  jarviz: "/brand/jarviz-avatar.webp",
  liz: "/brand/liz-avatar.webp",
  tutor: "/brand/tutor-avatar.webp",
};

export function BotAvatar({ name, size, className = "" }) {
  const portrait = portraits[name];
  if (!portrait) return null;

  return (
    <Image
      alt=""
      className={`bot-avatar ${className}`}
      src={portrait}
      width={size}
      height={size}
      unoptimized
    />
  );
}
