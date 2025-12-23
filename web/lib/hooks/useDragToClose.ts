import { useEffect, useState } from "react";

interface UseDragToCloseOptions {
  onClose: () => void;
  threshold?: number; // Distance in pixels to trigger close
}

export function useDragToClose({
  onClose,
  threshold = 100,
}: UseDragToCloseOptions) {
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag end logic
  const handleDragEnd = () => {
    if (dragStartY === null || dragCurrentY === null) {
      setDragStartY(null);
      setDragCurrentY(null);
      setIsDragging(false);
      return;
    }

    const dragDistance = dragCurrentY - dragStartY;
    // If dragged down more than threshold, close the panel
    if (dragDistance > threshold) {
      onClose();
    }

    setDragStartY(null);
    setDragCurrentY(null);
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null) return;
    setDragCurrentY(e.touches[0].clientY);
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection during drag
    setDragStartY(e.clientY);
    setIsDragging(true);
  };

  // Global mouse move and up handlers for smooth dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragStartY === null) return;
      setDragCurrentY(e.clientY);
    };

    const handleGlobalMouseUp = () => {
      if (dragStartY === null || dragCurrentY === null) {
        setDragStartY(null);
        setDragCurrentY(null);
        setIsDragging(false);
        return;
      }

      const dragDistance = dragCurrentY - dragStartY;
      if (dragDistance > threshold) {
        onClose();
      }

      setDragStartY(null);
      setDragCurrentY(null);
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStartY, dragCurrentY, onClose, threshold]);

  // Calculate drag offset for transform
  const getDragOffset = () => {
    if (dragStartY === null || dragCurrentY === null || !isDragging) {
      return 0;
    }
    const offset = dragCurrentY - dragStartY;
    // Only allow dragging down (positive offset)
    return Math.max(0, offset);
  };

  return {
    isDragging,
    dragOffset: getDragOffset(),
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleDragEnd,
      onMouseDown: handleMouseDown,
    },
  };
}
