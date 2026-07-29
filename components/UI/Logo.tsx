import React from "react";

interface LogoProps {
  className?: string;
  variant?: "stacked" | "horizontal" | "icon";
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", variant = "horizontal", size = "md" }: LogoProps) {
  const pixelSize = size === "sm" ? 64 : size === "md" ? 92 : 140;

  if (variant === "icon") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src="/logo.png"
          alt="Logo Icon"
          style={{ width: `${pixelSize}px`, height: `${pixelSize}px`, objectFit: "contain" }}
        />
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <img
          src="/logo.png"
          alt="Logo Icon"
          style={{ width: `${pixelSize * 1.3}px`, height: `${pixelSize * 1.3}px`, objectFit: "contain" }}
        />
        <div className="flex flex-col items-center">
          <span className="font-amiri text-3xl font-black text-[#1e5e4a] leading-none">تِلَاوَة</span>
          <span className="text-[#c8993c] font-sans font-black text-xs tracking-widest uppercase mt-1">Tilawah</span>
        </div>
      </div>
    );
  }

  // Default: Horizontal Layout
  return (
    <div className={`flex items-center gap-4 select-none ${className}`}>
      <img
        src="/logo.png"
        alt="Logo Icon"
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px`, objectFit: "contain" }}
      />
      <div className="flex flex-col justify-center">
        <span className="font-amiri text-3xl font-black text-[#1e5e4a] leading-none">تِلَاوَة</span>
        <span className="text-[#c8993c] font-sans font-black text-[11px] tracking-widest uppercase mt-1">Tilawah</span>
      </div>
    </div>
  );
}
