import * as dotenv from "dotenv";
import { AccountUpdate, Bool, Mina, PrivateKey, PublicKey, UInt64, UInt8 } from "o1js";
import { FungibleToken, FungibleTokenAdmin } from "./../index.js";

dotenv.config();

const { PRIVATE_KEY } = process.env;

const Network = Mina.Network("https://api.minascan.io/node/devnet/v1/graphql");
Mina.setActiveInstance(Network);
console.log("PRIVATE_KEY", PRIVATE_KEY)
class NamiToken extends FungibleToken {}

await FungibleTokenAdmin.compile();
await FungibleToken.compile();
await NamiToken.compile();

const { privateKey: tokenKey, publicKey: tokenAddress } = PrivateKey.randomKeypair();

console.log(`Token Private Key: ${tokenKey.toBase58()}`);
console.log(`Token Public Key: ${tokenAddress.toBase58()}`);
const token = new NamiToken(tokenAddress);

const { privateKey: adminKey, publicKey: adminAddress } = PrivateKey.randomKeypair();

console.log(`AdminFungibleToken Private Key: ${adminKey.toBase58()}`);
console.log(`AdminFungibleToken Public Key: ${adminAddress.toBase58()}`);

const deployerKey = PrivateKey.fromBase58(PRIVATE_KEY!);
const deployer = PublicKey.fromPrivateKey(deployerKey);

const fungibleTokenAdmin = new FungibleTokenAdmin(adminAddress);

const fee = 100_000_000;

console.log("Deploying token");

const tx = await Mina.transaction({ sender: deployer, fee }, async () => {
  AccountUpdate.fundNewAccount(deployer, 3);
  await fungibleTokenAdmin.deploy({ adminPublicKey: adminAddress });
  await token.deploy({
    symbol: "NAMI",
    src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts"
  });
  await token.initialize(adminAddress, UInt8.from(9), Bool(false));
});

await tx.prove();
tx.sign([deployerKey, tokenKey, adminKey]);
let pendingTransaction = await tx.send();

if (pendingTransaction.status === "rejected") {
  console.log("error sending transaction (see above)");
  process.exit(0);
}

console.log(`See transaction at https://minascan.io/devnet/tx/${pendingTransaction.hash}`);
console.log("Waiting for transaction to be included in a block");
await pendingTransaction.wait();

console.log("Token deployed");
