## Intro
An Application to monitor, analyse and trade FX

#### Todo
0. Consider MACD when determining pullbacks
1. Add account report bot
  1. Daily report
  2. Weekly report
  3. Monthly report
  4. Total report

### Other strategies to try
1. In the direction of the trend, enter at healthy bar, exit after 2 consecutive lizards.
  1. Handler Errors
  2. Example:
    For Buy:
      Trend is up (8, 21, 50) -
      At least 3 red bars (not just lizards) -
      No more than 3 green bars before the signal bar
      Bullish bar
      Stoploss at swing low
      3R target
      Exits at the first close below EMA8 (no matter the P/L)
2. HHLL Bot
  1.  Form higher timeframe bia based on if the market is making HH/HL or LL/HL
  2.  Example (If market is making HH and HL):
        1.  Only looking for a buy opportunities when the market has registered a new HL