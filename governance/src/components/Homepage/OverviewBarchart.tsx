import React, { useCallback } from "react";
import styled from "styled-components";

import { Subtitle, Title } from "shared/lib/designSystem";
import colors from "shared/lib/designSystem/colors";

const Bar = styled.div<{ width: number; color: string }>`
  display: flex;
  position: relative;
  height: 48px;
  width: ${(props) => props.width}px;
  background: ${(props) =>
    `linear-gradient(270deg, ${props.color}52 0%,  ${props.color}21 100%)`};
`;

interface OverviewBarchartProps {
  items: {
    name: string;
    value: number;
    formattedValue: string;
    color: string;
  }[];
  maxBarWidth: number;
  maxValue: number;
}

const OverviewBarchart: React.FC<OverviewBarchartProps> = ({
  items,
  maxBarWidth,
  maxValue,
}) => {
  const renderBarchartBar = useCallback(
    (key: string, value: number, formattedValue: string, color: string) => {
      return (
        <div key={key} className="d-flex align-items-center">
          <Bar color={color} width={maxBarWidth * (value / maxValue)}>
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                height: "100%",
                width: maxBarWidth * 0.01,
                maxWidth: "100%",
                background: color,
              }}
            />
          </Bar>
          <Title color={color} fontSize={14} lineHeight={20} className="ml-4">
            {formattedValue}
          </Title>
        </div>
      );
    },
    [maxBarWidth, maxValue]
  );

  return (
    <>
      <div className="d-flex flex-column">
        {items.map((item, index) => (
          <Subtitle
            key={index}
            fontSize={14}
            lineHeight={48}
            letterSpacing={1}
            color={colors.text}
            className="text-right"
          >
            {item.name}
          </Subtitle>
        ))}
      </div>

      {/* Right bar */}
      <div className="d-flex flex-column ml-4">
        {items.map((item, index) =>
          renderBarchartBar(
            index.toString(),
            item.value,
            item.formattedValue,
            item.color
          )
        )}
      </div>
    </>
  );
};

export default OverviewBarchart;