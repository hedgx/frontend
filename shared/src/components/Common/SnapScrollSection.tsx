import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSwipeable } from "react-swipeable";
import styled from "styled-components";

import colors from "../../designSystem/colors";
import { useBoundingclientrect } from "../../hooks/useBoundingclientrect";

const IndicatorContainer = styled.div<{ top?: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  left: 40px;
  top: calc(${(props) => (props.top ? `${props.top}px` : `50%`)} - 120px);
  height: 240px;
`;

const Indicator = styled.div<{ active: boolean }>`
  flex: 1;
  width: 4px;
  transition: 0.4s all ease-out;
  background: ${(props) => (props.active ? "white" : colors.background.four)};

  &:not(:last-child) {
    margin-bottom: 16px;
  }
`;

interface SnapScrollSectionProps {
  height: number;
  items: {
    containerClassName?: string;
    child: JSX.Element;
    anchor?: boolean;
  }[];
}

const SnapScrollSection: React.FC<
  React.HTMLAttributes<HTMLDivElement> & SnapScrollSectionProps
> = ({ items, height, className, ...props }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerBoundingRect = useBoundingclientrect(containerRef);
  const itemRefs = useMemo(
    () =>
      [...new Array(items.length)].reduce<any>((acc, _curr, index) => {
        acc[index] = React.createRef();
        return acc;
      }, {}),
    [items.length]
  );

  const [itemIndex, setItemIndex] = useState(0);
  const [scrollEvent, setScrollEvent] = useState<{
    timestamp: number;
    event?: "down" | "up";
    executed: boolean;
  }>({ timestamp: Date.now(), executed: true });

  /**
   * Scroll to item index
   */
  useEffect(() => {
    containerRef.current?.scrollTo({
      top: itemRefs[itemIndex].current?.offsetTop,
      behavior: "smooth",
    });
  }, [itemIndex, itemRefs]);

  const handleScrollUp = useCallback(() => {
    setItemIndex((curr) => {
      // Unable to scroll further to the top
      if (curr <= 0) {
        return 0;
      }

      return curr - 1;
    });
  }, []);

  const handleScrollDown = useCallback(() => {
    setItemIndex((curr) => {
      // Unable to scroll further to the bottom
      if (curr + 1 >= Object.keys(itemRefs).length) {
        return Object.keys(itemRefs).length - 1;
      }

      return curr + 1;
    });
  }, [itemRefs]);

  /**
   * Handle mobile swipe
   */
  const handlers = useSwipeable({
    onSwipedUp: handleScrollDown,
    onSwipedDown: handleScrollUp,
  });

  /**
   * Handle desktop wheel event
   */
  const handleWheel = useCallback((e: globalThis.WheelEvent) => {
    setScrollEvent((curr) => {
      const timeNow = Date.now();
      /**
       * Accept a scroll event every 500ms
       */
      if (timeNow - 500 <= curr.timestamp || e.deltaY === 0) {
        return curr;
      }

      return {
        timestamp: timeNow,
        event: e.deltaY > 0 ? "down" : "up",
        executed: false,
      };
    });
  }, []);

  /**
   * Register wheel event
   */
  useEffect(() => {
    const element = containerRef.current;

    if (element) {
      element.addEventListener("wheel", handleWheel);

      return () => {
        element?.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleWheel]);

  /**
   * Perform scroll event when it had changed
   */
  useEffect(() => {
    if (scrollEvent.executed) {
      return;
    }

    switch (scrollEvent.event) {
      case "down":
        handleScrollDown();
        break;
      case "up":
        handleScrollUp();
        break;
    }

    setScrollEvent((curr) => ({ ...curr, executed: true }));
  }, [handleScrollDown, handleScrollUp, scrollEvent]);

  /**
   * For ref sharing
   */
  const refPassthrough = useCallback(
    (el: HTMLDivElement) => {
      // call useSwipeable ref prop with el
      handlers.ref(el);

      // set myRef el so you can access it yourself
      containerRef.current = el;
    },
    [handlers]
  );

  return (
    <div
      {...props}
      ref={refPassthrough}
      className={`d-flex flex-wrap overflow-hidden w-100 position-relative ${
        className || ""
      }`}
      style={{ height }}
    >
      <IndicatorContainer
        top={
          containerBoundingRect
            ? containerBoundingRect.top + containerBoundingRect.height / 2
            : undefined
        }
      >
        {items.map((item, index) => {
          if (item.anchor !== false) {
            return (
              <Indicator
                key={index}
                active={index === itemIndex}
                role="button"
                onClick={() => setItemIndex(index)}
              />
            );
          }

          return null;
        })}
      </IndicatorContainer>
      {items.map((item, index) => (
        <div
          key={index}
          ref={itemRefs[index]}
          className={`d-flex w-100 ${item.containerClassName || ""}`}
        >
          {item.child}
        </div>
      ))}
    </div>
  );
};

export default SnapScrollSection;