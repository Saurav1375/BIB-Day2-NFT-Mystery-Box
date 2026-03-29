# NFT Mystery Box 🎁

## Project Title
**NFT Mystery Box** — A Decentralized NFT Loot Box Platform on Stellar

---

## Project Description

NFT Mystery Box is a blockchain-powered decentralized application (dApp) built on the **Stellar network** using the **Soroban smart contract** framework. The platform allows users to create sealed mystery boxes, each containing a randomly assigned NFT rarity tier — **Common, Rare, Epic, or Legendary**. The rarity of the NFT inside a mystery box remains hidden until the owner decides to reveal it by opening the box on-chain. Every action — from box creation to reveal — is recorded immutably on the Stellar blockchain, ensuring full transparency, fairness, and tamper-proof randomness. The smart contract also maintains real-time platform-wide statistics, giving both users and administrators a live view of the total number of boxes created, opened, and still sealed across the entire platform.

---

## Project Vision

The vision behind NFT Mystery Box is to bring the excitement and thrill of collectible loot-box mechanics into the Web3 ecosystem in a **trustless, transparent, and decentralized** manner. Traditional mystery box platforms often suffer from opaque algorithms, unfair drop rates, and centralized control — leaving users with no way to verify the authenticity of their rewards. By leveraging Stellar's Soroban smart contracts, NFT Mystery Box eliminates these pain points entirely:

- **On-Chain Randomness**: Rarity tiers are assigned using verifiable on-chain data (ledger timestamps), not hidden server-side algorithms.
- **Immutable Records**: Every box creation and reveal is permanently stored on the blockchain — no tampering, no manipulation.
- **Decentralized Ownership**: Users have full custody over their mystery boxes. No central authority can modify, revoke, or manipulate their assets.
- **Accessible & Low-Cost**: Built on Stellar's fast and low-fee network, making it accessible to users globally without prohibitive gas costs.

The long-term goal is to evolve this platform into a full NFT marketplace where mystery boxes can be traded, gifted, and integrated with gamified reward ecosystems.

---

## Key Features

| Feature | Description |
|---|---|
| 🎲 **Randomized Rarity Tiers** | Each mystery box is assigned a rarity tier (Common: 50%, Rare: 30%, Epic: 15%, Legendary: 5%) using on-chain pseudo-random logic at the time of creation. |
| 📦 **Create Mystery Boxes** | Users can create new sealed mystery boxes that are stored immutably on the Stellar blockchain. Each box receives a unique ID and records the owner's identity and creation timestamp. |
| 🔓 **Reveal (Open) Mystery Boxes** | Box owners can open their sealed mystery boxes to reveal the hidden NFT rarity tier. Once opened, the box is permanently marked as revealed with a recorded timestamp. |
| 📊 **Real-Time Platform Statistics** | The contract maintains live platform-wide stats — total boxes created, boxes opened, and boxes still sealed — accessible by anyone at any time. |
| 🔒 **Double-Open Protection** | The smart contract enforces a strict rule that prevents a mystery box from being opened more than once, ensuring integrity and preventing exploit attempts. |
| ⛓️ **Fully On-Chain** | All data — box details, rarity assignments, ownership, timestamps, and stats — is stored entirely on the Stellar blockchain with no off-chain dependencies. |

---

## Smart Contract Info

- All smart contract source code is located in the `contract/contracts/contract/` directory.
- **Path to smart contract**: `./contract/contracts/contract/src/lib.rs`
- **Path to test file**: `./contract/contracts/contract/src/test.rs`

### Functions Written Inside the NFT Mystery Box Smart Contract:

1. **`create_box(env: Env, owner: String) -> u64`**  
   Creates a new sealed mystery box for the specified owner. A pseudo-random NFT rarity tier (Common, Rare, Epic, or Legendary) is assigned at creation using on-chain ledger data. The box is stored on the blockchain and a unique box ID is returned.

2. **`open_box(env: Env, box_id: u64) -> MysteryBox`**  
   Opens (reveals) a sealed mystery box by its unique box ID. The hidden rarity tier is revealed, the box is marked as opened with a timestamp, and the updated box data is returned. Panics if the box does not exist or has already been opened.

3. **`view_box(env: Env, box_id: u64) -> MysteryBox`**  
   Retrieves the complete details of a mystery box by its unique box ID, including owner, rarity tier, creation time, opened status, and open time. Returns default values if the box is not found.

4. **`view_platform_stats(env: Env) -> PlatformStats`**  
   Returns the overall platform statistics including the total number of mystery boxes created, the number of opened boxes, and the number of boxes still sealed.

---

## Future Scope

- 🛒 **NFT Marketplace Integration** — Allow users to buy, sell, and trade mystery boxes with other users directly on-chain through a decentralized marketplace.
- 🎨 **NFT Metadata & Artwork** — Attach rich metadata (images, descriptions, attributes) to each rarity tier using IPFS or Stellar's data entries, turning mystery boxes into true collectible NFTs.
- 🏆 **Tiered Reward System** — Introduce seasonal events, limited-edition boxes, and bonus reward tiers to drive engagement and create scarcity.
- 👥 **Multi-Owner & Gifting Support** — Enable users to transfer or gift their sealed mystery boxes to other wallet addresses before opening.
- 🔗 **Cross-Chain Compatibility** — Explore bridging mystery box NFTs to other blockchains (Ethereum, Polygon) for broader ecosystem interoperability.
- 📱 **Frontend dApp** — Build a polished React-based frontend with wallet integration (Freighter) for a seamless user experience.
- 🎮 **Gamification Layer** — Add achievements, leaderboards, and streak bonuses for users who collect and open multiple mystery boxes.
- 🔐 **Enhanced Randomness** — Integrate a more robust on-chain randomness solution (e.g., VRF oracles) for provably fair rarity distribution.

## Contract Deployment Details
- **Contract ID**: CAMRESPDOECQDKX262Q4VZPAIP4ZRVYKG4I3J3VVXJSUBSIPTMEDC7JJ
- **Contract Screenshot**: <img width="1919" height="985" alt="image" src="https://github.com/user-attachments/assets/35c370c5-e339-4fdd-b299-11cab1645a3e" />
