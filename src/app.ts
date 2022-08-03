import * as dotenv from "dotenv";
import Web3 from "web3";
import {BlockHeader, BlockTransactionObject} from "web3-eth";
import {TransactionReceipt} from "web3-core";

dotenv.config();

const ERC165_ABI: any = [
    {
        inputs: [
            {
                internalType: "bytes4",
                name: "interfaceId",
                type: "bytes4",
            },
        ],
        name: "supportsInterface",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];
const ERC721_INTERFACE_ID = "0x80ac58cd";
const ERC1155_INTERFACE_ID = "0xd9b67a26";

const WSS_ENDPOINT: string = process.env.WSS_ENDPOINT || 'wss://mainnet.infura.io/v3/xxxxx';

const web3 = new Web3(new Web3.providers.WebsocketProvider(WSS_ENDPOINT));
web3.eth.subscribe("newBlockHeaders", async (err, blockHeader: BlockHeader) => {
        const { number } = blockHeader;
        console.log('New block: ', number);
        await checkBlockTransactions(number);
    })


async function checkBlockTransactions(blockNumber: number) {
    const {transactions}: BlockTransactionObject = await web3.eth.getBlock(blockNumber, true);
    for (const transaction of transactions) {
         if (!transaction.to) {
             // check if 'to' is null, it is contract deployment
             const {contractAddress}: TransactionReceipt = await web3.eth.getTransactionReceipt(transaction.hash);
             console.log(`New contract ${contractAddress} deployment tx: `, transaction.hash);

             if (contractAddress) {
                 // Check token standard
                 if (await isFallbackDefined(contractAddress)) continue; // Check fallback defined
                 if (await isERC721(contractAddress)) continue; // Check ERC721
                 if (await isERC1155(contractAddress)) continue; // Check ERC1155
                 // TODO: ERC20
                 console.log(`Unable to check contract standard: ${contractAddress}.`);
             }
         }
    }

}

async function isFallbackDefined(contractAddress: string) {
    try {
        await web3.eth.estimateGas({ to: contractAddress });
        console.log(`Fallback function is defined in ${contractAddress}. Unable to check contract standard.`);
        return true;
    } catch {
        // console.log(`Fallback function is not defined in ${contractAddress}.`);
        return false;
    }
}

async function isERC721(contractAddress: string) {
    const result  = await erc165Supported(contractAddress, ERC721_INTERFACE_ID);
    console.log(`${contractAddress} is ${result ? 'ERC721' : 'not ERC721'}`)
    return result
}

async function isERC1155(contractAddress: string) {
    const result  = await erc165Supported(contractAddress, ERC1155_INTERFACE_ID);
    console.log(`${contractAddress} is ${result ? 'ERC1155' : 'not ERC1155'}`)
    return result
}

async function erc165Supported(contractAddress: string, interfaceId: string) {
    const contract = new web3.eth.Contract(ERC165_ABI, contractAddress)
    try {
        return await contract.methods.supportsInterface(interfaceId).call();
    } catch {
        console.log(`${contractAddress} not support ERC165.`);
        return false;
    }
}

// TODO: These are for test, Should remove
checkBlockTransactions(4634748); // ERC20 (USDT), 0xdAC17F958D2ee523a2206206994597C13D831ec7
checkBlockTransactions(14996270); // ERC721 (STEPNNFT), 0x2A036569DBbe7730D69ed664B74412E49f43C2C0
checkBlockTransactions(12543530); // ERC1155 (Zapper NFT), 0xFAFf15C6cDAca61a4F87D329689293E07c98f578
// checkBlockTransactions(); // Proxy,

