import { CONTACT_FORM_URL } from "@/lib/site-config";

// お問い合わせ用Googleフォームが未設定のうちはプレースホルダを表示し、
// URLを設定したら自動的にリンクへ切り替わる(site-config.tsを1箇所直すだけでよい)。
export default function ContactLink({ label, unavailable }: { label: string; unavailable: string }) {
  if (!CONTACT_FORM_URL) {
    return <p className="text-sm text-zinc-400">{unavailable}</p>;
  }
  return (
    <a
      href={CONTACT_FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium underline"
    >
      {label}
    </a>
  );
}
