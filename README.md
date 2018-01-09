## A demo decentralized application on Ethereum blockchain

### How to run the demo

follow these steps:

1. install `node.js` and `npm` (tested with version 8.9.0)
2. install `truffle` runnin `npm install -g truffle@4.0.1`
3. install `ganache-cli` running `npm install -g ganache-cli@6.0.3`
4. run `ganache-cli` in the command line, this will give you 10 sample accounts, public and private keys, copy those, these keys will be required in the later steps.
5. navigate to root directory of the project
6. run `npm run build`
7. if everything went well this far, then you will see a `build` directory, open `build/contracts/Junkyard.json` and copy the network id, for example if you have a section like shown below you need to copy `1515497640144`
``` json 
"networks": {
    "1515497640144": {
      "events": {},
      "links": {},
      "address": "0x3219c9d5d5e11067b2624e5cba67a3016dd43f46"
    }
  }```

8. replace the network id copied in the previous step in `src/www/app.js` line #6 `const NETWORK_IDENTIFIER = "1515427019152";`

9. from the root of the application run `npm run start`.
10. navigate to http://localhost:8080
11. When prompted enter one of the addresses (obtained in #4) as junkyard owner and another for `my address` prompt.

