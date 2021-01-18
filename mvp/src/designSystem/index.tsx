import styled from "styled-components";
import { Card, Input } from "antd";

export const BaseText = styled.span`
  font-family: "Helvetica", sans-serif;
`;

export const PrimaryText = styled(BaseText)`
  font-family: Helvetica;
  font-style: normal;
  font-weight: normal;
  font-size: 16px;
`;

export const SecondaryText = styled(BaseText)`
  color: white;
`;

export const Title = styled(BaseText)`
  font-style: normal;
  font-weight: bold;
  font-size: 30px;
  line-height: 56px;
  text-align: center;

  color: #000000;
`;

export const ProductContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`;

export const CurrencyPairContainer = styled.div`
  margin-top: 12px;
  margin-bottom: 15px;
`;

export const Button = styled.button`
  border: none;
  cursor: pointer;
  outline: none;
  box-shadow: none;
  text-align: center;
`;

export const StyledCard = styled(Card)`
  box-shadow: 0 8px 24px 0 rgba(112, 144, 176, 0.15);
  border-radius: 10px;
  width: 90%;
`;

export const InputNumberStyled = styled(Input)`
  background-color: white;
  border-radius: 5px;
  width: 80%;
  margin-bottom: 15px;
`;