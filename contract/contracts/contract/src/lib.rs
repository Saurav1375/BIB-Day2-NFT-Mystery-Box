#![allow(non_snake_case)]
#![no_std]
use soroban_sdk::{contract, contracttype, contractimpl, log, Env, Symbol, String, symbol_short};


// Structure to track overall platform statistics for all mystery boxes.
#[contracttype]
#[derive(Clone)]
pub struct PlatformStats {
    pub total_boxes: u64,    // Total mystery boxes created on the platform
    pub opened_boxes: u64,   // Total mystery boxes that have been opened/revealed
    pub unopened_boxes: u64,  // Total mystery boxes still sealed and waiting to be opened
}


// Symbol key for storing platform-wide statistics.
const ALL_STATS: Symbol = symbol_short!("ALL_STAT");


// Enum representing NFT rarity tiers assigned to mystery boxes.
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum Rarity {
    Common,
    Rare,
    Epic,
    Legendary,
}


// Mapping a mystery box to its unique ID.
#[contracttype]
pub enum BoxBook {
    MysteryBox(u64),
}


// Counter symbol for generating unique box IDs.
const COUNT_BOX: Symbol = symbol_short!("C_BOX");


// Structure representing a single NFT Mystery Box.
#[contracttype]
#[derive(Clone)]
pub struct MysteryBox {
    pub box_id: u64,          // Unique identifier for the mystery box
    pub owner: String,        // Wallet address or name of the box owner
    pub rarity: Rarity,       // NFT rarity tier (assigned on creation, revealed on opening)
    pub is_opened: bool,      // Whether the box has been opened
    pub created_at: u64,      // Timestamp when the box was created
    pub opened_at: u64,       // Timestamp when the box was opened (0 if unopened)
}


#[contract]
pub struct MysteryBoxContract;


#[contractimpl]
impl MysteryBoxContract {

    // Creates a new sealed mystery box for the given owner.
    // A pseudo-random rarity tier is assigned at creation but remains hidden until the box is opened.
    // Returns the unique box ID of the newly created mystery box.
    pub fn create_box(env: Env, owner: String) -> u64 {
        let mut box_count: u64 = env.storage().instance().get(&COUNT_BOX).unwrap_or(0);
        box_count += 1;

        // Generate a pseudo-random rarity based on ledger timestamp and box count
        let timestamp = env.ledger().timestamp();
        let seed = timestamp.wrapping_add(box_count).wrapping_mul(31);
        let rarity_roll = seed % 100;

        let rarity = if rarity_roll < 50 {
            Rarity::Common       // 50% chance
        } else if rarity_roll < 80 {
            Rarity::Rare         // 30% chance
        } else if rarity_roll < 95 {
            Rarity::Epic         // 15% chance
        } else {
            Rarity::Legendary    // 5% chance
        };

        let new_box = MysteryBox {
            box_id: box_count,
            owner: owner.clone(),
            rarity,
            is_opened: false,
            created_at: timestamp,
            opened_at: 0,
        };

        // Update platform statistics
        let mut stats = Self::view_platform_stats(env.clone());
        stats.total_boxes += 1;
        stats.unopened_boxes += 1;

        // Store the mystery box on-chain
        env.storage().instance().set(&BoxBook::MysteryBox(box_count), &new_box);
        // Store updated platform stats
        env.storage().instance().set(&ALL_STATS, &stats);
        // Update the box counter
        env.storage().instance().set(&COUNT_BOX, &box_count);

        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Mystery Box Created with ID: {} for owner: {}", box_count, owner);

        box_count
    }


    // Opens (reveals) a sealed mystery box by its unique box_id.
    // The rarity tier is revealed and the box is marked as opened.
    // Panics if the box does not exist or has already been opened.
    pub fn open_box(env: Env, box_id: u64) -> MysteryBox {
        let key = BoxBook::MysteryBox(box_id);
        let mut mystery_box: MysteryBox = env.storage().instance().get(&key).unwrap_or(MysteryBox {
            box_id: 0,
            owner: String::from_str(&env, "Not_Found"),
            rarity: Rarity::Common,
            is_opened: true,
            created_at: 0,
            opened_at: 0,
        });

        // Ensure the box exists and has not been opened yet
        if mystery_box.box_id == 0 || mystery_box.is_opened == true {
            log!(&env, "Box ID: {} does not exist or is already opened!", box_id);
            panic!("Box does not exist or is already opened!");
        }

        let timestamp = env.ledger().timestamp();

        // Reveal the box
        mystery_box.is_opened = true;
        mystery_box.opened_at = timestamp;

        // Update platform statistics
        let mut stats = Self::view_platform_stats(env.clone());
        stats.opened_boxes += 1;
        stats.unopened_boxes -= 1;

        // Store updated data on-chain
        env.storage().instance().set(&key, &mystery_box);
        env.storage().instance().set(&ALL_STATS, &stats);

        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Mystery Box ID: {} has been opened!", box_id);

        mystery_box
    }


    // Retrieves the details of a mystery box by its unique box_id.
    // Returns default values if the box is not found.
    pub fn view_box(env: Env, box_id: u64) -> MysteryBox {
        let key = BoxBook::MysteryBox(box_id);

        env.storage().instance().get(&key).unwrap_or(MysteryBox {
            box_id: 0,
            owner: String::from_str(&env, "Not_Found"),
            rarity: Rarity::Common,
            is_opened: true,
            created_at: 0,
            opened_at: 0,
        })
    }


    // Returns the overall platform statistics including total, opened, and unopened mystery boxes.
    pub fn view_platform_stats(env: Env) -> PlatformStats {
        env.storage().instance().get(&ALL_STATS).unwrap_or(PlatformStats {
            total_boxes: 0,
            opened_boxes: 0,
            unopened_boxes: 0,
        })
    }
}


mod test;
