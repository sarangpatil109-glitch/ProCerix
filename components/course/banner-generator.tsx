"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { getThemeForCourse } from "./banner-themes";
import { BannerIcons } from "./banner-icons";
import { Sparkles, Trophy } from "lucide-react";

interface BannerGeneratorProps {
  title: string;
  category?: string;
  difficulty?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const BannerGeneratorBase: React.FC<BannerGeneratorProps> = ({
  title,
  category = "General",
  difficulty = "beginner",
  className = "",
  size = "md"
}) => {
  const theme = useMemo(() => getThemeForCourse(category, title), [category, title]);
  const IconComponent = BannerIcons[theme.id] || BannerIcons.general;

  // Responsive sizing based on standard proportions
  const isSmall = size === "sm";
  const isLarge = size === "lg";

  return (
    <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br ${theme.gradient} ${className}`}>
      {/* Dynamic Background SVGs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <IconComponent className={`absolute -right-10 -bottom-10 text-white ${isSmall ? 'w-32 h-32' : isLarge ? 'w-96 h-96' : 'w-64 h-64'}`} />
        <IconComponent className={`absolute top-10 left-10 text-white opacity-50 ${isSmall ? 'w-16 h-16' : isLarge ? 'w-48 h-48' : 'w-32 h-32'}`} />
        
        {/* Abstract Blobs */}
        <div className={`absolute top-0 right-0 ${isSmall ? 'w-32 h-32' : 'w-96 h-96'} rounded-full ${theme.blobColor} blur-3xl opacity-40 mix-blend-screen animate-pulse`} />
        <div className={`absolute -bottom-20 -left-20 ${isSmall ? 'w-48 h-48' : 'w-96 h-96'} rounded-full ${theme.blobColor} blur-3xl opacity-30 mix-blend-screen`} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuMDUiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik02MCAwaC02MHY2MGg2MFoiLz48L2c+PC9zdmc+')] pointer-events-none" />

      {/* Content Overlay */}
      <div className={`relative z-10 w-full h-full flex flex-col justify-between ${isSmall ? 'p-4' : isLarge ? 'p-12' : 'p-6'}`}>
        
        {/* Top: Logo & Badges */}
        <div className="flex justify-between items-start w-full">
          <div className={`${isSmall ? 'h-6' : isLarge ? 'h-10' : 'h-8'}`}>
            <img 
              src="/branding/logo.png" 
              alt="ProCerix" 
              className="h-full w-auto object-contain object-left"
            />
          </div>

          <div className="flex gap-2">
            {!isSmall && (
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium shadow-xl ${isLarge ? 'text-sm' : 'text-xs'}`}>
                <Trophy className="w-3 h-3" />
                <span className="capitalize">{difficulty}</span>
              </span>
            )}
            <span className={`px-3 py-1 rounded-full bg-white text-gray-900 font-bold shadow-xl capitalize ${isSmall ? 'text-[10px]' : isLarge ? 'text-sm' : 'text-xs'}`}>
              {category}
            </span>
          </div>
        </div>

        {/* Bottom: Title & Accents */}
        <div className="w-full mt-auto">
          <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            Premium Course
          </div>
          <h2 className={`font-bold text-white drop-shadow-lg leading-tight ${theme.accent} ${isSmall ? 'text-lg line-clamp-2' : isLarge ? 'text-5xl line-clamp-3' : 'text-2xl line-clamp-2'}`}>
            {title}
          </h2>
        </div>

      </div>
    </div>
  );
};

export const BannerGenerator = React.memo(BannerGeneratorBase);
BannerGenerator.displayName = "BannerGenerator";
