"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogDescription,
    DialogHeader,
} from "@/components/ui/dialog";

interface ImageGalleryDialogProps {
    images: string[]; // Array of image URLs
    productTitle: string;
    children: React.ReactNode; // The trigger element (e.g., the product image)
}

export function ImageGalleryDialog({ images, productTitle, children }: ImageGalleryDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    // Reset to first image when dialog opens
    React.useEffect(() => {
        if (open) setCurrentIndex(0);
    }, [open]);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    // Keyboard navigation
    React.useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") goToPrevious();
            if (e.key === "ArrowRight") goToNext();
            if (e.key === "Escape") setOpen(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, currentIndex, images.length]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-5xl bg-zinc-950 border-white/10 text-white p-0 overflow-hidden" hideCloseButton>
                {/* Accessible Title - Visually hidden but available to screen readers */}
                <DialogHeader className="sr-only">
                    <DialogTitle>{productTitle} - Image Gallery</DialogTitle>
                    <DialogDescription>
                        View product images. Use arrow keys or buttons to navigate between {images.length} image{images.length > 1 ? 's' : ''}.
                    </DialogDescription>
                </DialogHeader>

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg" aria-hidden="true">{productTitle}</h3>
                        {images.length > 1 && (
                            <p className="text-sm text-gray-400" aria-live="polite">
                                Image {currentIndex + 1} of {images.length}
                            </p>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-white/10"
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Main Image */}
                <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                    <div className="relative w-full h-full p-12">
                        <Image
                            src={images[currentIndex]}
                            alt={`${productTitle} - Image ${currentIndex + 1}`}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Navigation Arrows - Only show if multiple images */}
                    {images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/10"
                                onClick={goToPrevious}
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/10"
                                onClick={goToNext}
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </>
                    )}
                </div>

                {/* Thumbnail Strip - Only show if multiple images */}
                {images.length > 1 && (
                    <div className="bg-black/40 backdrop-blur-sm border-t border-white/10 px-6 py-2">
                        <div className="flex gap-4 justify-center overflow-x-auto pb-2 pt-2">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex
                                        ? "border-blue-500 scale-110 shadow-lg shadow-blue-500/30"
                                        : "border-white/20 hover:border-white/40 opacity-60 hover:opacity-100"
                                        }`}
                                >
                                    <Image
                                        src={img}
                                        alt={`Thumbnail ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
