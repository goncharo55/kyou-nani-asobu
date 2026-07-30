// MVP用に手動選定した、みんなで遊べる有名タイトルのシードリスト。
// moodTags / estimatedSessionMinutes / minPlayers・maxPlayers はSteam APIから機械的に
// 取得できないため、ここでは人手で妥当な値を設定している(将来的には実プレイデータや
// LLMによる説明文分類で置き換える想定。README参照)。
export const CURATED_SEED = [
  // --- 😀 笑いたい ---
  { appid: 728880, moods: ["laugh"], sessionMinutes: 45, players: [2, 4] }, // Overcooked! 2
  { appid: 285900, moods: ["laugh"], sessionMinutes: 30, players: [2, 4] }, // Gang Beasts
  { appid: 477160, moods: ["laugh"], sessionMinutes: 45, players: [2, 8] }, // Human: Fall Flat (オンライン最大8人)
  { appid: 674940, moods: ["laugh"], sessionMinutes: 30, players: [2, 4] }, // Stick Fight: The Game
  { appid: 431240, moods: ["laugh"], sessionMinutes: 30, players: [2, 12] }, // Golf With Your Friends (最大12人)
  { appid: 1097150, moods: ["laugh"], sessionMinutes: 30, players: [2, 4], priceOverrideJpy: 0 }, // Fall Guys (2022年に基本無料化。Steam APIのis_freeが不正確なため手動で上書き)
  { appid: 996770, moods: ["laugh"], sessionMinutes: 45, players: [2, 4] }, // Moving Out
  { appid: 1211630, moods: ["laugh"], sessionMinutes: 30, players: [2, 8] }, // The Jackbox Party Pack 7
  { appid: 880940, moods: ["laugh"], sessionMinutes: 45, players: [2, 8] }, // Pummel Party
  { appid: 945360, moods: ["laugh", "brain"], sessionMinutes: 30, players: [4, 15] }, // Among Us
  { appid: 1260320, moods: ["laugh"], sessionMinutes: 30, players: [2, 8] }, // Party Animals
  { appid: 386940, moods: ["laugh"], sessionMinutes: 30, players: [2, 4] }, // Ultimate Chicken Horse
  { appid: 1016920, moods: ["laugh", "brain"], sessionMinutes: 30, players: [2, 4] }, // Unrailed!
  { appid: 274190, moods: ["laugh"], sessionMinutes: 30, players: [2, 4] }, // Broforce
  { appid: 204360, moods: ["laugh"], sessionMinutes: 45, players: [2, 4] }, // Castle Crashers
  { appid: 238460, moods: ["laugh"], sessionMinutes: 45, players: [2, 4] }, // BattleBlock Theater

  // --- 😨 怖い ---
  { appid: 739630, moods: ["scary"], sessionMinutes: 45, players: [2, 4] }, // Phasmophobia
  { appid: 1966720, moods: ["scary", "laugh"], sessionMinutes: 45, players: [2, 4] }, // Lethal Company
  { appid: 381210, moods: ["scary"], sessionMinutes: 30, players: [2, 4] }, // Dead by Daylight
  { appid: 1304930, moods: ["scary"], sessionMinutes: 60, players: [2, 4] }, // The Outlast Trials
  { appid: 2881650, moods: ["scary", "laugh"], sessionMinutes: 45, players: [2, 4] }, // Content Warning
  { appid: 550, moods: ["scary"], sessionMinutes: 60, players: [2, 4] }, // Left 4 Dead 2

  // --- 🧠 頭使いたい ---
  { appid: 620, moods: ["brain"], sessionMinutes: 180, players: [2, 2] }, // Portal 2
  { appid: 341800, moods: ["brain", "laugh"], sessionMinutes: 30, players: [2, 4] }, // Keep Talking and Nobody Explodes
  { appid: 865360, moods: ["brain"], sessionMinutes: 180, players: [2, 2] }, // We Were Here Together
  { appid: 1426210, moods: ["brain", "chill"], sessionMinutes: 180, players: [2, 2] }, // It Takes Two
  { appid: 286160, moods: ["brain"], sessionMinutes: 60, players: [2, 10] }, // Tabletop Simulator
  { appid: 218620, moods: ["brain"], sessionMinutes: 60, players: [2, 4] }, // PAYDAY 2

  // --- 😌 まったり ---
  { appid: 1290000, moods: ["chill"], sessionMinutes: 45, players: [2, 4] }, // PowerWash Simulator
  { appid: 413150, moods: ["chill"], sessionMinutes: 60, players: [2, 4] }, // Stardew Valley
  { appid: 105600, moods: ["chill"], sessionMinutes: 60, players: [2, 4] }, // Terraria
  { appid: 648800, moods: ["chill"], sessionMinutes: 180, players: [2, 4] }, // Raft
  { appid: 892970, moods: ["chill"], sessionMinutes: 180, players: [2, 10] }, // Valheim
  { appid: 322330, moods: ["chill", "scary"], sessionMinutes: 180, players: [2, 6] }, // Don't Starve Together
  { appid: 632360, moods: ["brain"], sessionMinutes: 60, players: [2, 4] }, // Risk of Rain 2
  { appid: 548430, moods: ["laugh"], sessionMinutes: 60, players: [2, 4] }, // Deep Rock Galactic
];
