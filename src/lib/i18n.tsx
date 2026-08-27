"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ComparedToPrevious, ReturnLikelihood } from "@/lib/types";

export type Locale = "en" | "zh" | "ms";

export const LOCALES: Locale[] = ["en", "zh", "ms"];

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ms: "Bahasa Melayu",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  zh: "中",
  ms: "BM",
};

type Dict = {
  heading: string;
  subheading: string;
  rewardLine2: string;
  socialFollow: string;
  requiredError: string;
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneHint: string;
  submit: string;
  compared: Record<ComparedToPrevious, string>;
  returnLikelihood: Record<ReturnLikelihood, string>;
  confirm: {
    received: string;
    title: string;
    body: string;
    drawLabel: string;
    socialNote: string;
    ticket: string;
    submitted: string;
  };
};

const DICTS: Record<Locale, Dict> = {
  en: {
    heading: "❤️ Boss needs your true review!",
    subheading: "Good or bad, I really want to hear it!",
    rewardLine2: "📱 Stand a chance to Win an Apple iPad (worth RM 2,049)!",
    socialFollow: "Follow our social media to see the winner!",
    requiredError: "Add a short answer before sending.",
    nameLabel: "Your name (optional)",
    namePlaceholder: "Optional",
    phoneLabel: "Phone Number (To Win iPad)",
    phonePlaceholder: "Optional",
    phoneHint: "Required to enter the iPad draw",
    submit: "Send to the boss!",
    compared: { better: "Better", same: "Same", worse: "Worse", first_visit: "First visit" },
    returnLikelihood: {
      definitely: "Definitely",
      probably: "Probably",
      not_sure: "Not sure",
      probably_not: "Probably not",
      definitely_not: "Definitely not",
    },
    confirm: {
      received: "Received",
      title: "We've got it",
      body: "Your feedback is on the board for the {location} team right now. If you left a way to reach you, someone will follow up.",
      drawLabel: "📱 Your iPad draw entry",
      socialNote: "Follow our social media to see the winner!",
      ticket: "Ticket",
      submitted: "Submitted",
    },
  },
  zh: {
    heading: "❤️ 老板需要您的真实评价！",
    subheading: "无论好坏，我都想听到！",
    rewardLine2: "📱 还有机会赢取价值 RM 2,049 的 Apple iPad！",
    socialFollow: "关注我们的社交媒体查看得奖者！",
    requiredError: "发送前请填写简短回答。",
    nameLabel: "您的姓名（可选）",
    namePlaceholder: "可选",
    phoneLabel: "电话号码（可选：赢取 iPad）",
    phonePlaceholder: "方便我们跟进",
    phoneHint: "填写电话号码才能参加 iPad 抽奖",
    submit: "发送给老板！",
    compared: { better: "更好", same: "一样", worse: "更差", first_visit: "第一次光临" },
    returnLikelihood: {
      definitely: "一定会",
      probably: "可能会",
      not_sure: "不确定",
      probably_not: "可能不会",
      definitely_not: "一定不会",
    },
    confirm: {
      received: "已收到",
      title: "我们已收到",
      body: "您的反馈已发送至 {location} 团队的看板。如果您留下了联系方式，将会有人跟进。",
      drawLabel: "📱 您的 iPad 抽奖编号",
      socialNote: "关注我们的社交媒体查看得奖者！",
      ticket: "工单",
      submitted: "提交时间",
    },
  },
  ms: {
    heading: "❤️ Bos perlukan ulasan jujur anda!",
    subheading: "Baik atau buruk, saya benar-benar ingin dengar!",
    rewardLine2: "📱 Tambahan pula, berpeluang memenangi Apple iPad (bernilai RM 2,049)!",
    socialFollow: "Ikuti media sosial kami untuk lihat pemenang!",
    requiredError: "Sila isi jawapan ringkas sebelum menghantar.",
    nameLabel: "Nama anda (pilihan)",
    namePlaceholder: "Pilihan",
    phoneLabel: "Nombor telefon (pilihan: menangi iPad)",
    phonePlaceholder: "Supaya kami boleh susulan",
    phoneHint: "Diperlukan untuk menyertai cabutan iPad",
    submit: "Hantar kepada bos!",
    compared: { better: "Lebih baik", same: "Sama", worse: "Lebih teruk", first_visit: "Lawatan pertama" },
    returnLikelihood: {
      definitely: "Pasti",
      probably: "Mungkin",
      not_sure: "Tidak pasti",
      probably_not: "Mungkin tidak",
      definitely_not: "Pasti tidak",
    },
    confirm: {
      received: "Diterima",
      title: "Kami dah terima",
      body: "Maklum balas anda kini berada di papan untuk pasukan {location}. Jika anda tinggalkan cara untuk dihubungi, seseorang akan susulan.",
      drawLabel: "📱 Nombor cabutan iPad anda",
      socialNote: "Ikuti media sosial kami untuk lihat pemenang!",
      ticket: "Tiket",
      submitted: "Dihantar",
    },
  },
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: DICTS[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
