import { useEffect, useLayoutEffect, type RefObject } from 'react';

function moveTo(element: HTMLElement, top: number, left: number) {
  element.style.top = `${top}px`;
  element.style.left = `${left}px`;
}

/**
 * Places a `position: fixed` popup below its anchor (above when there is no
 * room), inside the viewport. Set directly on the element, so there is no
 * flash at the old position. The popup must be rendered inside the dialog
 * when the anchor is in a Sheet (a modal dialog makes the rest of the page inert).
 */
export function usePopoverPlacement(open: boolean, anchor: RefObject<HTMLElement | null>, popup: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const anchorEl = anchor.current;
    const popupEl = popup.current;
    if (!open || !anchorEl || !popupEl) return;
    const place = () => {
      const a = anchorEl.getBoundingClientRect();
      const p = popupEl.getBoundingClientRect();
      const margin = 8;
      const below = a.bottom + 4;
      const top = below + p.height + margin > window.innerHeight && a.top - 4 - p.height >= margin ? a.top - 4 - p.height : below;
      const left = Math.max(margin, Math.min(a.left, window.innerWidth - p.width - margin));
      moveTo(popupEl, top, left);
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchor, popup]);
}

/** Calls `onClose` for a pointer press outside both elements. */
export function useOutsidePress(open: boolean, elements: RefObject<HTMLElement | null>[], onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onPress = (event: PointerEvent) => {
      const target = event.target as Node;
      if (elements.some((ref) => ref.current?.contains(target))) return;
      onClose();
    };
    document.addEventListener('pointerdown', onPress, true);
    return () => document.removeEventListener('pointerdown', onPress, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);
}
