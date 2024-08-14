import * as dotenv from "dotenv";
import { AccountUpdate, Mina, PrivateKey, PublicKey, UInt64 } from "o1js";
import { FungibleToken, FungibleTokenAdmin } from "./../index.js";

dotenv.config();

const { PRIVATE_KEY, TOKEN_PRIVATE_KEY, TOKEN_PUBLIC_KEY, ADMIN_PRIVATE_KEY, ADMIN_PUBLIC_KEY } =
  process.env;

const Network = Mina.Network("https://api.minascan.io/node/devnet/v1/graphql");
Mina.setActiveInstance(Network);

class NamiToken extends FungibleToken {}

await FungibleTokenAdmin.compile();
await FungibleToken.compile();
await NamiToken.compile();

const tokenAddress = PublicKey.fromBase58(TOKEN_PUBLIC_KEY!);

const adminKey = PrivateKey.fromBase58(ADMIN_PRIVATE_KEY!);

const token = new NamiToken(tokenAddress);

const ownerKey = PrivateKey.fromBase58(PRIVATE_KEY!);
const owner = PublicKey.fromPrivateKey(ownerKey);

const fee = 100_000_000;

const ownerBalanceBeforeMint = (await token.getBalanceOf(owner)).toBigInt();
console.log("owner balance before mint:", ownerBalanceBeforeMint);

console.log("Minting token");

const mintTx = await Mina.transaction(
  {
    sender: owner,
    fee,
  },
  async () => {
    AccountUpdate.fundNewAccount(owner, 1);
    await token.mint(owner, new UInt64(2e9));
  }
);
await mintTx.prove();
mintTx.sign([ownerKey, adminKey]);
const mintTxResult = await mintTx.send().then((v) => v.wait());
console.log("Mint tx result:", mintTxResult.toPretty());

console.log(`See transaction at https://minascan.io/devnet/tx/${mintTxResult.hash}`);

const ownerBalanceAfterMint = (await token.getBalanceOf(owner)).toBigInt();
console.log("owner balance after mint:", ownerBalanceAfterMint);
