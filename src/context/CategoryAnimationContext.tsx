import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

interface CardRect {
  categoryId: string;
  rect: DOMRect;
}

interface AnimationState {
  isAnimating: boolean;
  clickedCategory: string | null;
  cardRect: CardRect | null;
}

interface CategoryAnimationContextType {
  animationState: AnimationState;
  registerCardRef: (categoryId: string, element: HTMLElement | null) => void;
  triggerAnimation: (categoryId: string) => CardRect | null;
  clearAnimation: () => void;
}

const CategoryAnimationContext = createContext<CategoryAnimationContextType | null>(null);

export function CategoryAnimationProvider({ children }: { children: ReactNode }) {
  const [animationState, setAnimationState] = useState<AnimationState>({
    isAnimating: false,
    clickedCategory: null,
    cardRect: null,
  });

  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const registerCardRef = useCallback((categoryId: string, element: HTMLElement | null) => {
    if (element) {
      cardRefs.current.set(categoryId, element);
    } else {
      cardRefs.current.delete(categoryId);
    }
  }, []);

  const triggerAnimation = useCallback((categoryId: string): CardRect | null => {
    const element = cardRefs.current.get(categoryId);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const cardRect = { categoryId, rect };

    setAnimationState({
      isAnimating: true,
      clickedCategory: categoryId,
      cardRect,
    });

    return cardRect;
  }, []);

  const clearAnimation = useCallback(() => {
    setAnimationState({
      isAnimating: false,
      clickedCategory: null,
      cardRect: null,
    });
  }, []);

  return (
    <CategoryAnimationContext.Provider
      value={{
        animationState,
        registerCardRef,
        triggerAnimation,
        clearAnimation,
      }}
    >
      {children}
    </CategoryAnimationContext.Provider>
  );
}

export function useCategoryAnimation() {
  const context = useContext(CategoryAnimationContext);
  if (!context) {
    throw new Error("useCategoryAnimation must be used within a CategoryAnimationProvider");
  }
  return context;
}
