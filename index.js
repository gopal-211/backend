const express = require('express')
const Moralis = require("moralis").default;
const cors = require("cors")
const app = express()
const port = 3001
const ABI = require("./Web3pay.json")

app.use(cors())
app.use(express.json())
app.get('/', (req, res) => {
  res.send('Hello , This is the back end of our application HFB08')
})


function convertArrayToObjects(array) {
    const data = array.map((transactions, i) => ({
      key: (array.length + 1 - i).toString(),
      type: transactions[0],
      amount: transactions[1],
      message: transactions[2],
      address: `${transactions[3].slice(0,4)}...${transactions[3].slice(0,4)}`,
      subject: transactions[4],
    }));
  
    return data.reverse();
  }
  
  app.get("/getUserDetails", async (req, res) => {
    const { userAddress } = req.query;
  
    const response = await Moralis.EvmApi.utils.runContractFunction({
      chain: "0x13881",
      address: "0x1DD469e6839F424F47BDAAeCed31D71a36B05905",
      functionName: "getUserName",
      abi: ABI,
      params: { _user: userAddress },
    });
  
    const ResponseName = response.raw;
  
    const secondResponse = await Moralis.EvmApi.balance.getNativeBalance({
      chain: "0x13881",
      address: userAddress,
    });
  
    const ResponseBalance = (secondResponse.raw.balance / 1e18).toFixed(2);
  
    const thirResponse = await Moralis.EvmApi.token.getTokenPrice({
      address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    });
  
    const ResponseDollars = (
      thirResponse.raw.usdPrice * ResponseBalance
    ).toFixed(2);
  
    const fourResponse = await Moralis.EvmApi.utils.runContractFunction({
      chain: "0x13881",
      address: "0x1DD469e6839F424F47BDAAeCed31D71a36B05905",
      functionName: "getUserHistory",
      abi: ABI,
      params: { _user: userAddress },
    });
  
    const ResponseHistory = convertArrayToObjects(fourResponse.raw);
  
  
    const fiveResponse = await Moralis.EvmApi.utils.runContractFunction({
      chain: "0x13881",
      address: "0x1DD469e6839F424F47BDAAeCed31D71a36B05905",
      functionName: "getUserRequests",
      abi: ABI,
      params: { _user: userAddress },
    });
  
    const ResponseRequests = fiveResponse.raw;
  
  
    const jsonResponse = {
      name: ResponseName,
      balance: ResponseBalance,
      dollars: ResponseDollars,
      history: ResponseHistory,
      requests: ResponseRequests,
    };
  
    return res.status(200).json(jsonResponse);
  });

  // functions of portfolio  to get the details of specific address
app.get("/nativeBalance", async (req, res) => {
  

  const { userAddress } = req.query;
  try {
    const secResponse = await Moralis.EvmApi.balance.getNativeBalance({
      chain: "0x13881",
      address: userAddress,
    });
  
    const jsonResponseBal = (secResponse.raw.balance / 1e18).toFixed(2);
  
    const thirResponse = await Moralis.EvmApi.token.getTokenPrice({
      address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    });
  
    const jsonResponseDollars = (
      thirResponse.raw.usdPrice * jsonResponseBal
    ).toFixed(2);

    const jsonResponse = {
     
      balance: jsonResponseBal,
      dollars: jsonResponseDollars,
    
    };
  
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('Error fetching native balance:', error);
    res.status(500).json({ error: 'An error occurred while fetching native balance' });
  }
});

//GET AMOUNT AND VALUE OF ERC20 TOKENS

app.get("/tokenBalances", async (req, res) => {
  
  try {
    const { address} = req.query;
    
    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      address: address,
      chain: "0x13881",
    });

    let tokens = response.data;
    let legitTokens = [];
    for (let i = 0; i < tokens.length; i++) {
      try {
        const priceResponse = await Moralis.EvmApi.token.getTokenPrice({
          address: tokens[i].token_address,
          chain: chain,
        });
        if (priceResponse.data.usdPrice > 0.01) {
          tokens[i].usd = priceResponse.data.usdPrice;
          legitTokens.push(tokens[i]);
        } else {
          console.log("no coins are there");
        }
      } catch (e) {
        console.log(e);
      }
    }


    res.send(legitTokens);
  } catch (e) {
    res.send(e);
  }
});

//GET Users NFT's

app.get("/nftBalance", async (req, res) => {
 
  try {
    const { address } = req.query;

    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address: address,
      chain: chain,
    });

    const userNFTs = response.data;

    res.send(userNFTs);
  } catch (e) {
    res.send(e);
  }
});

//GET USERS TOKEN TRANSFERS

app.get("/tokenTransfers", async (req, res) => {
 
  try {
    const { address } = req.query;

    const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
      address: address,
      chain: "0x13881"
    });
    
    const userTrans = response.data.result;

    let userTransDetails = [];
    
    for (let i = 0; i < userTrans.length; i++) {
      
      try {
        const metaResponse = await Moralis.EvmApi.token.getTokenMetadata({
          addresses: [userTrans[i].address],
          chain: "0x13881"
        });
        if (metaResponse.data) {
          userTrans[i].decimals = metaResponse.data[0].decimals;
          userTrans[i].symbol = metaResponse.data[0].symbol;
          userTransDetails.push(userTrans[i]);
        } else {
          console.log("no details for coin");
        }
      } catch (e) {
        console.log(e);
      }

    }



    res.send(userTransDetails);
  } catch (e) {
    res.send(e);
  }
});


Moralis.start({
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjdjYWZjY2QwLTQwN2QtNGUyZS05YjQ1LTA4NGNiYzhjYjg5OCIsIm9yZ0lkIjoiMzc3OTg3IiwidXNlcklkIjoiMzg4NDMzIiwidHlwZUlkIjoiOGQ5ZGUxOTQtYmZkZC00ZDc0LTlkMjgtOWQxNWFlMzIwODQ2IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MDgzNzg4NzIsImV4cCI6NDg2NDEzODg3Mn0.aJYLYBDmLgQAOAQxYLu8jLQ7ZhboQ9qidLNUitXEQ_g",
  }).then(() => {
    app.listen(port, () => {
      console.log(`Listening for API Calls at port ${port || 3001}`);
    });
  });