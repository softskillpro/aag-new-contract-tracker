import * as dotenv from "dotenv";
import Web3 from "web3";
import {BlockHeader, BlockTransactionObject} from "web3-eth";

dotenv.config();

const WSS_ENDPOINT: string = process.env.WSS_ENDPOINT || 'wss://mainnet.infura.io/v3/xxxxx';

const web3 = new Web3(new Web3.providers.WebsocketProvider(WSS_ENDPOINT));
web3.eth.subscribe(
    "newBlockHeaders",
    async (err, blockHeader: BlockHeader) => {
        const { number } = blockHeader;
        console.log('New block: ', number);
        await checkBlockTransactions(number);
    })


async function checkBlockTransactions(blockNumber: number) {
    const {transactions}: BlockTransactionObject = await web3.eth.getBlock(blockNumber, true);
    for (const transaction of transactions) {
         if (!transaction.to) {
             // check if 'to' is null, it is contract deployment
             console.log('New contract deployment tx: ', transaction);
             // TODO: Check token transaction
         }
    }

}

checkBlockTransactions(4634748); // TODO: This is for test, Should remove

