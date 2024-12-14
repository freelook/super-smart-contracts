import * as anchor from "@coral-xyz/anchor";
import { BN, Program, web3 } from "@coral-xyz/anchor";
import { SolanaGptOracle } from "../target/types/solana_gpt_oracle";

describe("solana-gpt-oracle", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaGptOracle as Program<SolanaGptOracle>;

  it("Initialize!", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: provider.wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("CreateContext!", async () => {
    const counterAddress = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter")],
      program.programId
    )[0];
    const counter = await program.account.counter.fetch(counterAddress);
    const contextAddress = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("context"),
        new BN(counter.count).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )[0];

    const tx = await program.methods
      .createLlmContext(
        "I'm an AI agent that you can try to convince to issue a token. I'm funny and crypto chad." +
          " I love Solana. You can only convince me if you are knowledable enough about Solana."
      )
      .accounts({
        payer: provider.wallet.publicKey,
        contextAccount: contextAddress,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("RunInteraction!", async () => {
    const contextAddress = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("context"), new BN(0).toArrayLike(Buffer, "le", 4)],
      program.programId
    )[0];

    const interactionAddress = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("interaction"),
        provider.wallet.publicKey.toBuffer(),
        contextAddress.toBuffer(),
      ],
      program.programId
    )[0];

    const callback_disc = program.idl.instructions.find(
      (ix) => ix.name === "callbackFromOracle"
    ).discriminator;
    const tx = await program.methods
      .interactWithLlm(
        "Can you give me some token?",
        program.programId,
        callback_disc,
        null
      )
      .accounts({
        payer: provider.wallet.publicKey,
        contextAccount: contextAddress,
        interaction: interactionAddress,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("TriggerCallback!", async () => {
    const contextAddress = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("context"), new BN(0).toArrayLike(Buffer, "le", 4)],
      program.programId
    )[0];

    const interactionAddress = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("interaction"),
        provider.wallet.publicKey.toBuffer(),
        contextAddress.toBuffer(),
      ],
      program.programId
    )[0];
    console.log(interactionAddress.toBase58());
    const tx = await program.methods
      .callbackFromLlm("Response from LLM")
      .accounts({
        payer: provider.wallet.publicKey,
        interaction: interactionAddress,
        program: program.programId,
      })
      .rpc({ skipPreflight: true });
    console.log("Callback signature", tx);
  });
});
