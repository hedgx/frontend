import { Duration } from "moment";
import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "ethers";
import { assetToFiat } from "./math";
import { parseUnits } from "ethers/lib/utils";

const { formatUnits } = ethers.utils;

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

interface BaseRewardsCalculationProps {
  poolSize: BigNumber;
  poolReward: BigNumber;
  pricePerShare: BigNumber;
  decimals: number;
  assetPrice: number;
  rbnPrice: number;
}

export const calculateBaseRewards = ({
  poolSize,
  poolReward,
  pricePerShare,
  decimals,
  assetPrice,
  rbnPrice,
}: BaseRewardsCalculationProps) => {
  const poolRewardInUSD = parseFloat(assetToFiat(poolReward, rbnPrice));
  const poolSizeInAsset = poolSize
    .mul(pricePerShare)
    .div(parseUnits("1", decimals));
  const poolSizeInUSD = parseFloat(
    assetToFiat(poolSizeInAsset, assetPrice, decimals)
  );

  return poolSizeInUSD > 0
    ? ((1 + poolRewardInUSD / poolSizeInUSD) ** 52 - 1) * 100
    : 0;
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
  let l = Number(gaugeBalance.toString());
  const L = Number(poolLiquidity.toString()) + l;
  const veRBNAmt = parseFloat(formatUnits(veRBNAmount, 18));
  const totalVeRBNAmt = parseFloat(formatUnits(totalVeRBN, 18));
  const workingBalanceAmt = Number(workingBalance.toString());
  const workingSupplyAmt = Number(workingSupply.toString());

  const TOKENLESS_PRODUCTION = 40;

  let lim = (l * TOKENLESS_PRODUCTION) / 100;
  lim +=
    (((L * veRBNAmt) / totalVeRBNAmt) * (100 - TOKENLESS_PRODUCTION)) / 100;
  lim = Math.min(l, lim);

  let old_bal = workingBalanceAmt;
  let noboost_lim = (TOKENLESS_PRODUCTION * l) / 100;
  let noboost_supply = workingSupplyAmt + noboost_lim - old_bal;
  let _working_supply = workingSupplyAmt + lim - old_bal;

  return lim / _working_supply / (noboost_lim / noboost_supply);
};
