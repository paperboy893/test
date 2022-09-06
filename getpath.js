const Web3 = require('web3');
const fs = require('fs');
const prompt = require("prompt-sync")({ sigint: true });
// const events = require('./logs/events.js');
require('dotenv').config()
let allPairs = require('./pairs/allPairs.json')

let RPC_ULR = "https://bsc-dataseed1.binance.org"


if (process.env.NODE_ENV === "production") {
	RPC_ULR = "ws://localhost:8546"
  } 



// console.log(RPC_ULR)
// const web3 = new Web3(RPC_ULR);
// const newBlockEvent = web3.eth.subscribe('newBlockHeaders')

// newBlockEvent.on('connected', () =>{console.log('Bot listening!')})
// newBlockEvent.on('data', async function(blockHeader){
//     console.log(blockHeader);
// })

// newBlockEvent.on('error', console.error);
  
const findArbitrage = async (pairs,tokens,maxHops,path,bestTrade,currentPair,poolName) => {
 
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i]
        let tempOut
        let newPath = [...path]
        if(pair.poolName != poolName){
            if(pair.token0.address == tokens.in.address || pair.token1.address == tokens.in.address){
            if(pair.reserve0 / Math.pow(10, pair.token0.decimal) < 1 || pair.reserve0 / Math.pow(10, pair.token0.decimal) <1 ) return
            if(tokens.in.address == pair.token0.address){
                tempOut = pair.token1
            }else{
                tempOut = pair.token0
            }
            newPath.push(tempOut)
       
            if(tempOut.address == tokens.out.address && path.length > 1){
                currentPair.push(pair)
                currentPair = currentPair.map((pair) => {return {paths: newPath, ...pair}})
                bestTrade = [...bestTrade,  ...currentPair]
                break
            } 
            else if(maxHops > 1 && pairs.length >1){

                currentPair.push(pair)
                maxHops = maxHops -1
                pairs.slice(i+1,1)
                bestTrade =  findArbitrage(pairs,{ in: tempOut, out: tokens.out },maxHops,newPath,bestTrade,currentPair,pair.poolName)
                break
            }

        }
    }
    
    }
    return bestTrade
};

const findByToken = async (_token,_symbol) => {
    let cek =1
    let AllResult = []
    let fixedLength = 10
    let maxHops = 2
    tokens = {
        in: {
          address: _token,
        },
        out: {
          address: "0x55d398326f99059fF775485246999027B3197955",
        },
      }

    cek=1
    while(cek<allPairs.length){

        let bestTrade = []
        let path = [{
            address: _token,
            symbol: _symbol,
            decimal: '18'
          }]
        let currentPair = []
        
        let result = await findArbitrage(allPairs.slice(cek+1),tokens,maxHops,path,bestTrade,currentPair,"none");
        if(result && result.length == 2){
        console.log(` ========================================================================== `)
        console.log(` Route: ${result.length} ${cek}`)
        const paths = result[0].paths
        let pathing = []
        let Exchanges = []
        
        for (let i = 0; i < paths.length; i++) {
            pathing.push(paths[i].symbol)
        }
        
        for (let i = 0; i < result.length; i++) {
            Exchanges.push(result[i].poolName)
        }
        console.log(` Pathing: ${pathing.join(" -> ")} `)
        console.log(` Routes: ${Exchanges.join(" -> ")} `)
        for (let i = 0; i < result.length; i++) {
            console.log(` ${result[i].poolName} https://bscscan.com/address/${result[i].address} ${result[i].token0.symbol} <=> ${result[i].token1.symbol}`)
        }
        
        // const asd = prompt("stop")
        console.log(` ========================================================================== `)
        AllResult = [...AllResult, result]
        }
        cek = cek + 1
       
        
    }
    

    return AllResult

    
}

stable_coins = [
        {
          address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            symbol: "WBNB",
        }
        // ,{
        //     address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
        //       symbol: "BUSD",
        //   }
        //   ,{
        //     address: "0x55d398326f99059fF775485246999027B3197955",
        //       symbol: "USDT",
        //   }
        //   ,{
        //     address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
        //       symbol: "ETH",
        //   },{
        //     address: "0x14016E85a25aeb13065688cAFB43044C2ef86784",
        //       symbol: "TUSD",
        //   },{
        //     address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        //       symbol: "USDC",
        //   }
      
    ]

const main = async () => {
  
    let AllResult = []
    let result =[]
    for (let i = 0; i < stable_coins.length; i++) {
        result = await findByToken(stable_coins[i].address,stable_coins[i].symbol)
        AllResult = [...AllResult, ...result]
    }
    
    
    let path = `./pairs/3HopsFlash.json`
    fs.writeFile(path, JSON.stringify(AllResult), {
        flag: 'w'
    }, err => {
        if(err) throw err;
        // console.log(`${path} New data added`);
        return true;
    });
    
}

main()

