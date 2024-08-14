import * as dotenv from "dotenv";
import { AccountUpdate, Mina, PrivateKey, PublicKey, UInt64 } from "o1js";
import { FungibleToken, FungibleTokenAdmin } from "./../index.js";

dotenv.config();

const { PRIVATE_KEY, TOKEN_PUBLIC_KEY, ADMIN_PUBLIC_KEY } =
  process.env;

const Network = Mina.Network("https://api.minascan.io/node/devnet/v1/graphql");
Mina.setActiveInstance(Network);

class NamiToken extends FungibleToken {}

await FungibleTokenAdmin.compile();
await FungibleToken.compile();
await NamiToken.compile();


const tokenAddress = PublicKey.fromBase58(TOKEN_PUBLIC_KEY!);

const adminAddress = PublicKey.fromBase58(ADMIN_PUBLIC_KEY!);

const token = new NamiToken(tokenAddress);

const ownerKey = PrivateKey.fromBase58(PRIVATE_KEY!);
const owner = PublicKey.fromPrivateKey(ownerKey);

const fee = 100_000_000;

const ownerBalanceBeforeTransfer = (await token.getBalanceOf(owner)).toBigInt();
console.log("owner balance before transfer:", ownerBalanceBeforeTransfer);

const adminBalanceBeforeTransfer = (await token.getBalanceOf(adminAddress)).toBigInt();
console.log("admin balance before transfer:", adminBalanceBeforeTransfer);

console.log("Transferring tokens from owner to admin");
const transferTx = await Mina.transaction(
  {
    sender: owner,
    fee,
  },
  async () => {
    AccountUpdate.fundNewAccount(owner, 1);
    await token.transfer(owner, adminAddress, new UInt64(1e9));
  }
);
await transferTx.prove();
transferTx.sign([ownerKey]);
const transferTxResult = await transferTx.send().then((v) => v.wait());
console.log("Transfer tx result:", transferTxResult.toPretty());

console.log(`See transaction at https://minascan.io/devnet/tx/${transferTxResult.hash}`);

const ownerBalanceAfterTransfer = (await token.getBalanceOf(owner)).toBigInt();
console.log("owner balance before transfer:", ownerBalanceAfterTransfer);

const adminBalanceAfterTransfer = (await token.getBalanceOf(adminAddress)).toBigInt();
console.log("admin balance before transfer:", adminBalanceAfterTransfer);
