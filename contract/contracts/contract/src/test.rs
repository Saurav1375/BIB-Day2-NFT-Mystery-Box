#![cfg(test)]

use super::*;
use soroban_sdk::{vec, Env, String};

#[test]
#[should_panic(expected = "Box does not exist or is already opened!")]
fn test_open_already_opened_box() {
    let env = Env::default();
    let contract_id = env.register(MysteryBoxContract, ());
    let client = MysteryBoxContractClient::new(&env, &contract_id);

    let owner = String::from_str(&env, "owner_wallet_000");
    let box_id = client.create_box(&owner);

    // Open the box first time - should succeed
    client.open_box(&box_id);

    // Open the same box again - should panic
    client.open_box(&box_id);
}
