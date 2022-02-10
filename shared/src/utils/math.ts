import moment, { Duration } from "moment";
import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "ethers";
import currency from "currency.js";
import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber";

import { getDefaultSignificantDecimalsFromAssetDecimals } from "./asset";

const { formatUnits } = ethers.utils;

export const formatSignificantDecimals = (
  num: string,
  significantDecimals: number = 6
) => parseFloat(parseFloat(num).toFixed(significantDecimals)).toString();

/**
 *
 * @param n Number
 * @param alwaysShowDecimals Optional.
 * If true, always show decimals. If false, clip decimals if required.
 * eg. with n of 10.1000, value of false will return 10.1.
 * @returns
 */
export const formatAmount = (
  n: number,
  alwaysShowDecimals?: boolean
): string => {
  if (n < 1e4) {
    return `${currency(n, { separator: ",", symbol: "" }).format()}`;
  }
  if (n >= 1e4 && n < 1e6) {
    const v = alwaysShowDecimals
      ? (n / 1e3).toFixed(2)
      : parseFloat((n / 1e3).toFixed(2));
    return `${v}K`;
  }
  if (n >= 1e6 && n < 1e9) {
    const v = alwaysShowDecimals
      ? (n / 1e6).toFixed(2)
      : parseFloat((n / 1e6).toFixed(2));
    return `${v}M`;
  }
  if (n >= 1e9 && n < 1e12) {
    const v = alwaysShowDecimals
      ? (n / 1e9).toFixed(2)
      : parseFloat((n / 1e9).toFixed(2));
    return `${v}B`;
  }
  if (n >= 1e12) {
    const v = alwaysShowDecimals
      ? (n / 1e12).toFixed(2)
      : parseFloat((n / 1e12).toFixed(2));
    return `${v}T`;
  }

  return "";
};

export const formatBigNumber = (
  num: BigNumber,
  decimals: number = 18,
  significantDecimals?: number
) => {
  const _significantDecimals =
    significantDecimals ||
    getDefaultSignificantDecimalsFromAssetDecimals(decimals);
  return parseFloat(formatUnits(num, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: _significantDecimals,
  });
};

export const formatBigNumberAmount = (
  num: BigNumber,
  decimals: number = 18
) => {
  return formatAmount(parseFloat(formatUnits(num, decimals)));
};

export const toFiat = (etherVal: BigNumber) => {
  const scaleFactor = ethers.BigNumber.from(10).pow("6");
  const scaled = etherVal.div(scaleFactor);
  return scaled.toNumber() / 10 ** 2;
};

export const toUSD = (bn: BigNumber) =>
  Math.floor(parseFloat(ethers.utils.formatEther(bn))).toLocaleString();

export const toETH = (bn: BigNumber, precision: number = 4) =>
  parseFloat(ethers.utils.formatEther(bn)).toFixed(precision);

export const assetToFiat = (
  num: BigNumber | number,
  assetPrice: number,
  assetDecimal: number = 18,
  precision: number = 2
): string =>
  (isBigNumberish(num)
    ? parseFloat(ethers.utils.formatUnits(num, assetDecimal)) * assetPrice
    : num * assetPrice
  ).toFixed(precision);

export const assetToUSD = (
  num: BigNumber | number,
  assetPrice: number,
  assetDecimal: number = 18,
  precision: number = 2
): string =>
  currency(assetToFiat(num, assetPrice, assetDecimal, precision)).format();

export const ethToUSD = (
  num: BigNumber | number,
  ethPrice: number,
  precision: number = 2
): string => assetToUSD(num, ethPrice, 18, precision);

export const formatOption = (bn: BigNumber): number =>
  parseFloat(ethers.utils.formatUnits(bn, 8));

export const getWAD = (decimals: number): BigNumber =>
  ethers.utils.parseUnits("1", decimals);

export const wmul = (x: BigNumber, y: BigNumber, decimals: number) =>
  x
    .mul(y)
    .add(getWAD(decimals).div(ethers.BigNumber.from("2")))
    .div(getWAD(decimals));

export const annualizedPerformance = (performance: number) =>
  (performance * 0.9 + 1) ** 52 - 1;

export const getRange = (start: number, stop: number, step: number) => {
  const a = [start];
  let b = start;
  while (b < stop) {
    a.push((b += step || 1));
  }
  return a;
};

export const handleSmallNumber = (n: number, decimals: number = 4): number => {
  let parsedString = n.toFixed(decimals);
  if (n < 1e-6) {
    parsedString = n.toPrecision(1);
  } else if (n < 1e-4) {
    parsedString = n.toPrecision(2);
  }

  return parseFloat(parsedString);
};

export const isPracticallyZero = (
  num: BigNumber,
  decimals: number,
  marginString?: string
) => {
  const defaultSignificantDecimals =
    getDefaultSignificantDecimalsFromAssetDecimals(decimals);
  const _marginString =
    marginString ||
    (1 / 10 ** defaultSignificantDecimals).toFixed(defaultSignificantDecimals);
  const margin = ethers.utils.parseUnits(_marginString, decimals);
  return num.lt(margin);
};

export const amountAfterSlippage = (
  num: BigNumber,
  slippage: number, // this is a float
  decimals: number = 18
) => {
  if (slippage >= 1.0) {
    throw new Error("Slippage cannot exceed 100%");
  }
  const discountValue = ethers.utils
    .parseUnits("1", decimals)
    .sub(ethers.utils.parseUnits(slippage.toFixed(3), decimals));
  return num.mul(discountValue).div(BigNumber.from(10).pow(decimals));
};

export const calculateInitialveRBNAmount = (
  rbnAmount: BigNumber,
  duration: Duration
) => {
  const totalHours = Math.round(duration.asHours());
  const hoursInTwoYears = 365 * 2 * 24;
  const veRbnAmount = rbnAmount
    .mul(BigNumber.from(totalHours))
    .div(BigNumber.from(hoursInTwoYears));
  return veRbnAmount.isNegative() ? BigNumber.from(0) : veRbnAmount;
};

interface BoostMultiplierCalculationProps {
  // workingBalance and workingSupply is 18 decimals big number
  workingBalance: BigNumber;
  workingSupply: BigNumber;
  // gauge balance and pool liquidity is BigNumber, with the respective decimals
  // according to the underlying asset
  gaugeBalance: BigNumber;
  poolLiquidity: BigNumber;
  veRBNAmount: BigNumber;
  totalVeRBN: BigNumber;
}
// Calculates the boost for staking in vault gauges
export const calculateBoostMultiplier = ({
  workingBalance,
  workingSupply,
  gaugeBalance,
  poolLiquidity,
  veRBNAmount,
  totalVeRBN,
}: BoostMultiplierCalculationProps) => {
  // If gauge balance is 0, always returns 0
  if (gaugeBalance.isZero() || !totalVeRBN) {
    return 0;
  } else {
    const L = poolLiquidity.add(gaugeBalance);

    const TOKENLESS_PRODUCTION = 40;

    let lim = gaugeBalance.mul(TOKENLESS_PRODUCTION).div(100);

    // lim is the biggest number when totalVeRBN is 0 to prevent division by 0
    console.log("YOUR veRBN", formatUnits(veRBNAmount))
    console.log("TOTAL veRBN in VotingEscrow", formatUnits(totalVeRBN))
    lim = totalVeRBN.isZero()
      ? BigNumber.from(String(Number.MAX_SAFE_INTEGER))
      : L.mul(veRBNAmount)
          .div(totalVeRBN)
          .mul(100 - TOKENLESS_PRODUCTION)
          .div(100);
    lim = lim.gt(gaugeBalance) ? gaugeBalance : lim;

    let noboost_lim = gaugeBalance.mul(TOKENLESS_PRODUCTION).div(100);
    let noboost_supply = workingSupply.add(noboost_lim).sub(workingBalance);
    let _working_supply = workingSupply.add(lim).sub(workingBalance);

    const lhs =
      parseFloat(formatUnits(lim)) / parseFloat(formatUnits(_working_supply));
    const rhs =
      parseFloat(formatUnits(noboost_lim)) /
      parseFloat(formatUnits(noboost_supply));

      console.log(lhs, rhs)


    // console.log("BOOST INFO", {
    //   working_balances: workingBalance.toString(),
    //   working_supply: workingSupply.toString(),
    //   gaugeBalance: gaugeBalance.toString(),
    //   poolLiquidity: poolLiquidity.toString(),
    //   L: L.toString(),
    //   lim: lim.toString(),
    //   noboost_lim: noboost_lim.toString(),
    //   noboost_supply: noboost_supply.toString(),
    //   veRBN: veRBNAmount.toString(),
    //   totalVeRBN: totalVeRBN.toString(),
    // });


    const boost = lhs / rhs;
    return Math.round(boost * 100) / 100;
  }
};
