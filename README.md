# DTX-staking

This page aims at depicting the main financial and mathematical logic behind the staking of DTX as well as the financial flow underneath it. 

## Motivation
Databroker is a peer-to-peer marketplace which enables any entity to sell their data in return of financial compensation. It enables the easy upload of any kind of data from the data supplier directly on the blockchain. The buyer, one a product bought has 30 days to report any issue regarding the data. If there is an issue with the underlying data, the transaction is reverted.

Within this user flow, an amount of DTX is stored on a wallet for the 30 days period, as an escrow. The main issue we are facing when it comes to this flow, is the difference of price between the beginning of the 30 days period and the end. This difference can lead to accounting issues for the different entities using our platform.

In order to remedy this problem, we decided to launch our Staking Program. The aim of it is to reward token holders by sending a portion (which variates on each deal) to the community. From a financial point of view, it should bring more stability in the token price as well as a steady inflation rate of it thanks to the growing interest in the token as well as in the project. 

## Staking Financial flow

![alt text](https://github.com/databrokerglobal/DTX-staking/blob/main/financial_flow.png)

In a nutshell, at every single deal done on the platform databroker.global a commission is sent to Databroker staking smart contract. It does mean that the commission per month will not be same from one month to the other. The more deals being done, the more rewards will be sent to the token holders.

The financial logic of the staking Smart Contract is to assign shares to each staker and rewards are in proportion to the share. Just like Mutual Funds has NAV(Net Asset Value) and it increases or decreases based on the shares inside of it. Similar way the NAV in our case will be DTX per Share price which will increase as and when rewards are been added to the staking program.

By default the initial ratio will be set at 1:1, so 1 DTX is equal to 1 share. Each user which stake at this ratio will receive an equal amout of shares for the number of DTX she/he staked. 
As previously mentionned, during the month a commission will be sent to the Databroker smart contract, which will alter the number of DTX on the contract and by default alter the ratio share:DTX . The underlying formula can be simplified as followed:


<img src="https://latex.codecogs.com/svg.image?frac{\sum&space;DTX}{\sum&space;Share}" title="frac{\sum DTX}{\sum Share}" />

The above formula will update the ratio at which each stakeholder will be able to stake or unstake at period X. If we want now to express in Mathematical expression what will be the stake + rewards of a stake holder when she/he decides to unstake, it could be simply expressed as follow:

<img src="https://latex.codecogs.com/svg.image?x&space;=&space;Ratio&space;Share/DTX&space;*&space;StakedAmount&space;*&space;TotalDTX" title="x = Ratio Share/DTX * StakedAmount * TotalDTX" />

And in the same veine, the transition for the ratio between time T and time T+1 (after the stake) would be expressed as follow:

<img src="https://latex.codecogs.com/svg.image?x&space;=&space;\sum&space;Share&space;(t-1)&space;-&space;\frac{stakedAmout}{ratio&space;ShareDtx&space;(t-1)}" title="x = \sum Share (t-1) - \frac{stakedAmout}{ratio ShareDtx (t-1)}" />


## Final comment

The smart contract has been deployed on the Polygon network for the sake of speed and cost compared to the Ethereum mainnet. The application built is a react application directly connected to network, it can be accessible on the following link: https://wwww.staking.databroker.global. It accepts for now couple of wallets and the team is working on additional ones, please use it at your own risk.

