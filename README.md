EventCoin

Team Member Information

Name - Sumit Singh
CWID - 884416991
Email - sumit_singh43@csu.fullerton.edu

Name- Vraj Patel
CWID - 811318955
Email- vrajpatel@csu.fullerton.edu

------------------------------------------------------------------

Original Project

Original project repository: https://github.com/Dataryx/EventCoin

------------------------------------------------------------------

Improvement Status

No further Improvement. Made completely from scratch

------------------------------------------------------------------

How to Run the Project

1. Install prerequisites:
   - Node.js
   - npm
   - Ganache
   - MetaMask
2. Install dependencies from the project root:

bash
npm install


3. Start Ganache on 'http://127.0.0.1:7545'.
4. Configure the environment file. Use '.env.example' as the reference and make sure these values are set in '.env':

env
MNEMONIC="replace with Ganache wallet mnemonic"
INFURA_ENDPOINT="http://127.0.0.1:7545"
NEXT_PUBLIC_RPC_URL="http://127.0.0.1:7545"
NEXT_PUBLIC_DIAMOND_ADDRESS="replace with deployed contract address"
```

5. Compile the smart contracts:

bash
npm run compile


6. Deploy the contracts to the local Ganache network:

bash
npm run migrate:reset


7. Start the web application:

bash
npm run dev


8. Open 'http://localhost:3000' in the browser.
9. Connect MetaMask to the same Ganache network before using blockchain features.

-----------------------------------------------------------------------------------
