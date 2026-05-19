import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ isOpen, onClose, children, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div 
        ref={sheetRef}
        className={cn(
          "relative w-full max-w-md mx-auto bg-card rounded-t-3xl shadow-xl border-t border-border mt-auto max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300",
          className
        )}
      >
        <div className="flex justify-center p-3 shrink-0">
          <div className="w-12 h-1.5 bg-muted rounded-full opacity-50" />
        </div>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground bg-secondary rounded-full transition-colors"
        >
          <X size={18} />
        </button>
        <div className="overflow-y-auto px-6 pb-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
