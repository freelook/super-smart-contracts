use anchor_lang::prelude::ProgramError;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke_signed;

declare_id!("LLMrieZMpbJFwN52WgmBNMxYojrpRVYXdC1RCweEbab");

#[program]
pub mod solana_gpt_oracle {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn create_llm_context(ctx: Context<CreateLlmContext>, text: String) -> Result<()> {
        let context_account = &mut ctx.accounts.context_account;
        context_account.text = text;
        ctx.accounts.counter.count += 1;
        Ok(())
    }

    pub fn interact_with_llm(
        ctx: Context<InteractWithLlm>,
        text: String,
        callback_program_id: Pubkey,
        callback_discriminator: [u8; 8],
        account_metas: Option<Vec<AccountMeta>>,
    ) -> Result<()> {
        let interaction = &mut ctx.accounts.interaction;
        interaction.context = ctx.accounts.context_account.key();
        interaction.user = ctx.accounts.payer.key();
        interaction.text = text;
        interaction.callback_program_id = callback_program_id;
        interaction.callback_discriminator = callback_discriminator;
        interaction.callback_account_metas = account_metas.unwrap_or_default();
        Ok(())
    }

    pub fn callback_from_llm<'info>(
        ctx: Context<'_, '_, '_, 'info, CallbackFromLlm<'info>>,
        response: String,
    ) -> Result<()> {
        let response_data = [
            ctx.accounts.interaction.callback_discriminator.to_vec(),
            response.try_to_vec()?,
        ]
        .concat();

        // Prepare accounts metas
        let mut accounts_metas: Vec<anchor_lang::solana_program::instruction::AccountMeta> =
            vec![anchor_lang::solana_program::instruction::AccountMeta {
                pubkey: ctx.accounts.identity.key(),
                is_signer: true,
                is_writable: false,
            }];
        accounts_metas.extend(
            ctx.accounts
                .interaction
                .callback_account_metas
                .iter()
                .map(
                    |meta| anchor_lang::solana_program::instruction::AccountMeta {
                        pubkey: meta.pubkey,
                        is_signer: meta.is_signer,
                        is_writable: meta.is_writable,
                    },
                ),
        );

        // Verify payer is not in remaining accounts
        if ctx
            .remaining_accounts
            .iter()
            .any(|acc| acc.key().eq(&ctx.accounts.payer.key()))
        {
            return Err(ProgramError::InvalidAccountData.into());
        }

        // CPI to the callback program
        let instruction = Instruction {
            program_id: ctx.accounts.program.key(),
            accounts: accounts_metas,
            data: response_data.to_vec(),
        };
        let mut remaining_accounts: Vec<AccountInfo<'info>> = ctx.remaining_accounts.to_vec();
        remaining_accounts.push(ctx.accounts.identity.to_account_info());
        remaining_accounts.push(ctx.accounts.program.to_account_info());
        let identity_bump = ctx.bumps.identity;
        invoke_signed(
            &instruction,
            &remaining_accounts,
            &[&[b"identity", &[identity_bump]]],
        )?;
        Ok(())
    }

    pub fn callback_from_oracle(ctx: Context<CallbackFromOracle>, response: String) -> Result<()> {
        if !ctx.accounts.identity.to_account_info().is_signer {
            return Err(ProgramError::InvalidAccountData.into());
        }
        msg!("Callback response: {:?}", response);
        Ok(())
    }
}

/// Contexts

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8,
        seeds = [b"identity"],
        bump
    )]
    pub identity: Account<'info, Identity>,
    #[account(
        init,
        payer = payer,
        space = 8 + 32,
        seeds = [b"counter"],
        bump
    )]
    pub counter: Account<'info, Counter>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(text: String)]
pub struct CreateLlmContext<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut,
        seeds = [b"counter"],
        bump
    )]
    pub counter: Account<'info, Counter>,
    #[account(
        init,
        payer = payer,
        space = 8 + text.as_bytes().len() + 8,
        seeds = [ContextAccount::seed(), &counter.count.to_le_bytes()],
        bump
    )]
    pub context_account: Account<'info, ContextAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(text: String, callback_program_id: Pubkey, callback_discriminator: [u8; 8], account_metas: Option<Vec<AccountMeta>>)]
pub struct InteractWithLlm<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 120 + text.as_bytes().len() + account_metas.as_ref().map_or(0, |m| m.len()) * AccountMeta::size(),
        seeds = [Interaction::seed(), payer.key().as_ref(), context_account.key().as_ref()],
        bump
    )]
    pub interaction: Account<'info, Interaction>,
    /// CHECK: we accept any context
    pub context_account: Account<'info, ContextAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CallbackFromLlm<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(seeds = [b"identity"], bump)]
    pub identity: Account<'info, Identity>,
    /// CHECK: we accept any context
    #[account(mut, close = payer)]
    pub interaction: Account<'info, Interaction>,
    /// CHECK: the callback program
    pub program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CallbackFromOracle<'info> {
    #[account(seeds = [b"identity"], bump)]
    pub identity: Account<'info, Identity>,
}

/// Accounts

#[account]
pub struct ContextAccount {
    pub text: String,
}

impl ContextAccount {
    pub fn seed() -> &'static [u8] {
        b"context"
    }
}

#[account]
#[derive(Debug)]
pub struct Interaction {
    pub context: Pubkey,
    pub user: Pubkey,
    pub text: String,
    pub callback_program_id: Pubkey,
    pub callback_discriminator: [u8; 8],
    pub callback_account_metas: Vec<AccountMeta>,
}

impl Interaction {
    pub fn seed() -> &'static [u8] {
        b"interaction"
    }
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AccountMeta {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

impl AccountMeta {
    pub fn size() -> usize {
        8 + AccountMeta::INIT_SPACE
    }
}

#[account]
pub struct Counter {
    pub count: u32,
}

#[account]
pub struct Identity {}
