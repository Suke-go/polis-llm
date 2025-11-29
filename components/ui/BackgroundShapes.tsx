"use client";

import React from "react";

export function BackgroundShapes() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Large Yellow Circle - Top Right */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />
      
      {/* Red Circle - Bottom Left */}
      <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" />

      {/* Purple Rectangle - Floating mid-left */}
      <div className="absolute top-1/3 left-10 w-20 h-20 border-4 border-primary/20 rounded-2xl animate-rotate-slow" />

      {/* Pink Fan/Triangle - Bottom Right */}
      <div className="absolute bottom-20 right-20 w-0 h-0 border-l-[50px] border-l-transparent border-t-[80px] border-t-highlight/20 border-r-[50px] border-r-transparent animate-float-delayed transform rotate-12" />

      {/* Decorative Grid Lines - adding 'Science' feel */}
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-slate-200/50" />
      <div className="absolute top-0 right-1/4 w-[1px] h-full bg-slate-200/50" />
      <div className="absolute top-1/3 left-0 w-full h-[1px] bg-slate-200/50" />
      <div className="absolute bottom-1/3 left-0 w-full h-[1px] bg-slate-200/50" />
    </div>
  );
}

