import type { MoodKey } from "./games";

// ラベル文言はロケールごとに src/messages/*.json の "mood" 名前空間で管理する
// (t(`mood.${key}`) の形で参照する)。ここでは絵文字とキー一覧のみを持つ。
export const MOOD_KEYS: MoodKey[] = ["laugh", "scary", "brain", "chill"];

const MOOD_EMOJI: Record<MoodKey, string> = {
  laugh: "😀",
  scary: "😨",
  brain: "🧠",
  chill: "😌",
};

export function moodEmoji(key: MoodKey): string {
  return MOOD_EMOJI[key] ?? "";
}
