# LaneShark 2: Premium Evolution

**LaneShark 2** is a high-fidelity, arcade-style **Bowling RPG** that merges precise physical simulation with deep character progression and an "Official Championship" arcade framing.

### 🎯 Key Product Essence

Unlike simple bowling sims, LaneShark 2 is a "Bowling Career" experience. Players compete in various venues, earn money, level up their skills, and shop for premium equipment. It features a sophisticated pseudo-3D perspective engine and an interactive shop for customizing balls and clothing.

### 🛠️ Technical Stack

* **Engine**: Custom physics-based game engine written in React/TypeScript.
* **Rendering**: High-performance Canvas-based rendering with custom shading for pins and lanes.
* **State Management**: Complex local persistence for player profiles, inventory, and stats.
* **Assets**: Modular asset loading system for textures, sound effects, and animations.

### ✨ Core Features

* **Player Progression**: Full XP and Leveling system. As players compete, they earn experience and unlock new ranks.
* **Pro Shop 🛍️**: An interactive marketplace where players can spend earned "LaneCash" on new balls (with different stats) and clothing outfits.
* **Dynamic Environments**: Cyber-Arena aesthetics with volumetric lighting, particles, and realistic wood grain lane textures.
* **Tournament Modes**: Support for Single Player career, 2-player local versus, and "Official Championship" modes.
* **Detailed Analytics**: A statistics screen tracking strikes, spares, average score, and total earnings.
* **Interactive Tutorial**: A guided onboarding system for mastering ball hook, speed, and positioning.

### 📂 Directory Insights

* `/src/CricketGame.tsx`: The main game entry point (don't let the filename fool you; it's the core LaneShark engine).
* `/src/components/GameCanvas`: The rendering hub for the dynamic 3D lane and physical pins.
* `/src/data/shopItems.ts`: The database of unlockable balls, outfits, and equipment.
* `/src/utils/storageUtils.ts`: Logic for persisting player progress and inventory.
