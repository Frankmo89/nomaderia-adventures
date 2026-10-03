import { BRAND_ASSETS } from "@/config/assets";

type LogoProps = {
  variant?: "default" | "onDark";
  className?: string;
};

const Logo = ({ variant = "default", className }: LogoProps) => {
  const src = variant === "onDark" ? BRAND_ASSETS.logoOnDark : BRAND_ASSETS.logo;

  return (
    <img
      src={src}
      alt="Nomaderia"
      width={533}
      height={130}
      loading="eager"
      decoding="async"
      className={className}
    />
  );
};

export default Logo;
