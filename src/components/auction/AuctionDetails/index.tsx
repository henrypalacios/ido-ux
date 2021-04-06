import React, { useMemo } from 'react'
import styled from 'styled-components'

import { useClearingPriceInfo } from '../../../hooks/useCurrentClearingOrderAndVolumeCallback'
import {
  AuctionState,
  DerivedAuctionInfo,
  orderToPrice,
  orderToSellOrder,
} from '../../../state/orderPlacement/hooks'
import { AuctionIdentifier } from '../../../state/orderPlacement/reducer'
import { getExplorerLink, getTokenDisplay } from '../../../utils'
import { abbreviation } from '../../../utils/numeral'
import { KeyValue } from '../../common/KeyValue'
import { Tooltip } from '../../common/Tooltip'
import { ExternalLink } from '../../navigation/ExternalLink'
import { BaseCard } from '../../pureStyledComponents/BaseCard'
import TokenLogo from '../../token/TokenLogo'
import { AuctionTimer } from '../AuctionTimer'

const Wrapper = styled(BaseCard)`
  align-items: center;
  display: grid;
  margin: 0 0 28px;
  max-width: 100%;
  min-height: 130px;
  grid-template-columns: 1fr 3px 1fr;
  grid-template-areas:
    'top top top'
    'col1 sep1 col2'
    'col3 sep2 col4';
  padding-bottom: 20px;
  row-gap: 15px;

  @media (min-width: ${({ theme }) => theme.themeBreakPoints.md}) {
    grid-template-areas: none;
    grid-template-columns: 1fr 3px 1fr 154px 1fr 3px 1fr;
    padding-bottom: 0;
    margin: 0 0 50px;
  }
`

const Cell = styled(KeyValue)`
  &.col1 {
    grid-area: col1;
  }

  &.col2 {
    grid-area: col2;
  }

  &.col3 {
    grid-area: col3;
  }

  &.col4 {
    grid-area: col4;
  }

  @media (min-width: ${({ theme }) => theme.themeBreakPoints.md}) {
    padding: 0 10px;

    &.col1,
    &.col2,
    &.col3,
    &.col4 {
      grid-area: unset;
    }

    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
    }
  }
`

const Break = styled.div`
  background-color: ${({ theme }) => theme.primary1};
  border-radius: 3px;
  min-height: 50px;
  width: 3px;

  &.sep1 {
    grid-area: sep1;
  }
  &.sep2 {
    grid-area: sep2;
  }

  @media (min-width: ${({ theme }) => theme.themeBreakPoints.md}) {
    &.sep1,
    &.sep2 {
      grid-area: unset;
    }
  }
`

const TimerWrapper = styled.div`
  grid-area: top;
  margin: -65px auto 15px;
  max-height: 130px;
  position: relative;

  @media (min-width: ${({ theme }) => theme.themeBreakPoints.md}) {
    grid-area: unset;
    margin: 0;
  }
`

interface AuctionDetailsProps {
  auctionIdentifier: AuctionIdentifier
  auctionState: AuctionState
  derivedAuctionInfo: DerivedAuctionInfo
}

const AuctionDetails = (props: AuctionDetailsProps) => {
  const { auctionIdentifier, auctionState, derivedAuctionInfo } = props
  const { chainId } = auctionIdentifier

  const auctionTokenAddress = useMemo(
    () => getExplorerLink(chainId, derivedAuctionInfo?.auctioningToken?.address, 'address'),
    [chainId, derivedAuctionInfo?.auctioningToken],
  )

  const biddingTokenAddress = useMemo(
    () => getExplorerLink(chainId, derivedAuctionInfo?.biddingToken?.address, 'address'),
    [chainId, derivedAuctionInfo?.biddingToken],
  )

  const { clearingPriceInfo } = useClearingPriceInfo(auctionIdentifier)
  const biddingTokenDisplay = useMemo(() => getTokenDisplay(derivedAuctionInfo?.biddingToken), [
    derivedAuctionInfo?.biddingToken,
  ])
  const auctioningTokenDisplay = useMemo(
    () => getTokenDisplay(derivedAuctionInfo?.auctioningToken),
    [derivedAuctionInfo?.auctioningToken],
  )
  const clearingPriceDisplay = useMemo(() => {
    const clearingPriceInfoAsSellOrder =
      clearingPriceInfo &&
      orderToSellOrder(
        clearingPriceInfo.clearingOrder,
        derivedAuctionInfo?.biddingToken,
        derivedAuctionInfo?.auctioningToken,
      )
    const clearingPriceNumber = orderToPrice(clearingPriceInfoAsSellOrder)?.toSignificant(4)

    return clearingPriceNumber
      ? `${abbreviation(clearingPriceNumber)} ${getTokenDisplay(
          derivedAuctionInfo?.auctioningToken,
        )}/${getTokenDisplay(derivedAuctionInfo?.biddingToken)}`
      : '-'
  }, [derivedAuctionInfo?.auctioningToken, derivedAuctionInfo?.biddingToken, clearingPriceInfo])

  const titlePrice = useMemo(
    () =>
      !auctionState
        ? 'Loading...'
        : auctionState === AuctionState.ORDER_PLACING ||
          auctionState === AuctionState.ORDER_PLACING_AND_CANCELING
        ? 'Current price'
        : auctionState === AuctionState.PRICE_SUBMISSION
        ? 'Clearing price'
        : 'Closing price',
    [auctionState],
  )

  const initialPriceToDisplay = derivedAuctionInfo?.initialPrice
  return (
    <Wrapper noPadding>
      <Cell
        className="col1"
        itemKey={
          <>
            <span>{titlePrice}</span>
            <Tooltip
              id="auctionPrice"
              text={
                "This will be the auction's Closing Price if no more bids are submitted or canceled, OR it will be the auction's Clearing Price if the auction concludes without additional bids."
              }
            />
          </>
        }
        itemValue={clearingPriceDisplay ? clearingPriceDisplay : '-'}
      />
      <Break className="sep1" />
      <Cell
        className="col2"
        itemKey={
          <>
            <span>Bidding with</span>
            <Tooltip
              id="biddingWith"
              text={'This is the token that is accepted for bidding in the auction.'}
            />
          </>
        }
        itemValue={
          derivedAuctionInfo?.biddingToken ? (
            <>
              <TokenLogo
                size={'20px'}
                token={{
                  address: derivedAuctionInfo?.biddingToken.address,
                  symbol: derivedAuctionInfo?.biddingToken.symbol,
                }}
              />
              <span>{biddingTokenDisplay}</span>
              <ExternalLink href={biddingTokenAddress} />
            </>
          ) : (
            '-'
          )
        }
      />
      <TimerWrapper className="top">
        <AuctionTimer auctionState={auctionState} derivedAuctionInfo={derivedAuctionInfo} />
      </TimerWrapper>
      <Cell
        className="col3"
        itemKey={
          <>
            <span>Total auctioned</span>
            <Tooltip
              id="totalAuctioned"
              text={'Total amount of tokens available to be bought in the auction.'}
            />
          </>
        }
        itemValue={
          derivedAuctionInfo?.auctioningToken && derivedAuctionInfo?.initialAuctionOrder ? (
            <>
              <TokenLogo
                size={'20px'}
                token={{
                  address: derivedAuctionInfo?.auctioningToken.address,
                  symbol: derivedAuctionInfo?.auctioningToken.symbol,
                }}
              />
              <span>{`${abbreviation(
                derivedAuctionInfo?.initialAuctionOrder?.sellAmount.toSignificant(2),
              )} ${auctioningTokenDisplay}`}</span>
              <ExternalLink href={auctionTokenAddress} />
            </>
          ) : (
            '-'
          )
        }
      />
      <Break className="sep2" />
      <Cell
        className="col4"
        itemKey={
          <>
            <span>Min Sell Price</span>
            <Tooltip
              id="minSellPrice"
              text={'Minimum bidding price the auctioneer defined for participation.'}
            />
          </>
        }
        itemValue={
          <>
            {initialPriceToDisplay ? abbreviation(initialPriceToDisplay?.toSignificant(2)) : ' - '}
            {initialPriceToDisplay && auctioningTokenDisplay
              ? ` ${auctioningTokenDisplay}/${biddingTokenDisplay}`
              : '-'}
          </>
        }
      />
    </Wrapper>
  )
}

export default AuctionDetails
