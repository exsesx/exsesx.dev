import type { Project } from "./projects";

type ProjectAccent = Project["accent"];

type AccentFaceClasses = {
  surface: string;
};

type ProjectAccentClasses = {
  gradient: string;
  topLight: string;
  card: AccentFaceClasses & {
    mediaShadow: string;
  };
  detailHero: AccentFaceClasses;
};

export const PROJECT_ACCENT_CLASSES: Record<ProjectAccent, ProjectAccentClasses> = {
  amber: {
    gradient: "from-[rgba(132,92,246,0.5)] via-[rgba(74,28,170,0.2)] to-transparent",
    topLight: "bg-[linear-gradient(180deg,rgba(132,92,246,0.22),rgba(112,42,236,0.05)_48%,rgba(24,24,27,0))]",
    card: {
      surface:
        "border-[rgba(132,92,246,0.18)] shadow-[0_0_0_1px_rgba(132,92,246,0.10),0_28px_80px_rgba(112,42,236,0.16)] hover:border-[rgba(132,92,246,0.32)]",
      mediaShadow: "shadow-[0_0_0_1px_rgba(132,92,246,0.16),0_0_34px_rgba(112,42,236,0.14)]",
    },
    detailHero: {
      surface:
        "border-[rgba(132,92,246,0.18)] shadow-[0_0_0_1px_rgba(132,92,246,0.10),0_30px_90px_rgba(112,42,236,0.18)]",
    },
  },
  controlup: {
    gradient: "from-[rgba(56,135,232,0.5)] via-[rgba(16,60,120,0.22)] to-[rgba(251,176,59,0.1)]",
    topLight: "bg-[linear-gradient(180deg,rgba(56,135,232,0.22),rgba(251,176,59,0.06)_48%,rgba(24,24,27,0))]",
    card: {
      surface:
        "border-[rgba(56,135,232,0.18)] shadow-[0_0_0_1px_rgba(56,135,232,0.10),0_28px_80px_rgba(7,31,61,0.22)] hover:border-[rgba(56,135,232,0.32)]",
      mediaShadow: "shadow-[0_0_0_1px_rgba(56,135,232,0.16),0_0_36px_rgba(56,135,232,0.14)]",
    },
    detailHero: {
      surface: "border-[rgba(56,135,232,0.18)] shadow-[0_0_0_1px_rgba(56,135,232,0.10),0_30px_90px_rgba(7,31,61,0.24)]",
    },
  },
  mint: {
    gradient: "from-[rgba(58,128,224,0.5)] via-[rgba(12,46,96,0.22)] to-transparent",
    topLight: "bg-[linear-gradient(180deg,rgba(58,128,224,0.22),rgba(12,46,96,0.05)_48%,rgba(24,24,27,0))]",
    card: {
      surface:
        "border-[rgba(58,128,224,0.18)] shadow-[0_0_0_1px_rgba(58,128,224,0.10),0_28px_80px_rgba(9,30,57,0.22)] hover:border-[rgba(58,128,224,0.32)]",
      mediaShadow: "shadow-[0_0_0_1px_rgba(58,128,224,0.16),0_0_34px_rgba(58,128,224,0.13)]",
    },
    detailHero: {
      surface: "border-[rgba(58,128,224,0.18)] shadow-[0_0_0_1px_rgba(58,128,224,0.10),0_30px_90px_rgba(9,30,57,0.24)]",
    },
  },
  quicklizard: {
    gradient: "from-[rgba(64,168,196,0.5)] via-[rgba(28,92,112,0.2)] to-[rgba(255,140,40,0.1)]",
    topLight: "bg-[linear-gradient(180deg,rgba(64,168,196,0.22),rgba(255,140,40,0.06)_48%,rgba(24,24,27,0))]",
    card: {
      surface:
        "border-[rgba(64,168,196,0.18)] shadow-[0_0_0_1px_rgba(64,168,196,0.10),0_28px_80px_rgba(64,121,140,0.16)] hover:border-[rgba(64,168,196,0.32)]",
      mediaShadow: "shadow-[0_0_0_1px_rgba(64,168,196,0.16),0_0_34px_rgba(64,168,196,0.14)]",
    },
    detailHero: {
      surface:
        "border-[rgba(64,168,196,0.18)] shadow-[0_0_0_1px_rgba(64,168,196,0.10),0_30px_90px_rgba(64,121,140,0.18)]",
    },
  },
  rose: {
    gradient: "from-[rgba(232,80,104,0.5)] via-[rgba(176,24,40,0.2)] to-[rgba(235,120,70,0.1)]",
    topLight: "bg-[linear-gradient(180deg,rgba(232,80,104,0.22),rgba(235,120,70,0.06)_48%,rgba(24,24,27,0))]",
    card: {
      surface:
        "border-[rgba(232,80,104,0.18)] shadow-[0_0_0_1px_rgba(232,80,104,0.10),0_28px_80px_rgba(235,31,40,0.14)] hover:border-[rgba(232,80,104,0.32)]",
      mediaShadow: "shadow-[0_0_0_1px_rgba(232,80,104,0.15),0_0_34px_rgba(235,31,40,0.13)]",
    },
    detailHero: {
      surface:
        "border-[rgba(232,80,104,0.18)] shadow-[0_0_0_1px_rgba(232,80,104,0.10),0_30px_90px_rgba(235,31,40,0.16)]",
    },
  },
  steel: {
    gradient: "from-[rgba(96,150,196,0.42)] via-[rgba(52,80,116,0.2)] to-transparent",
    topLight: "bg-[linear-gradient(180deg,rgba(96,150,196,0.18),rgba(52,80,116,0.05)_48%,rgba(24,24,27,0))]",
    card: {
      surface:
        "border-[rgba(96,150,196,0.16)] shadow-[0_0_0_1px_rgba(96,150,196,0.08),0_28px_80px_rgba(52,80,116,0.14)] hover:border-[rgba(96,150,196,0.28)]",
      mediaShadow: "shadow-[0_0_0_1px_rgba(96,150,196,0.13),0_0_34px_rgba(96,150,196,0.10)]",
    },
    detailHero: {
      surface:
        "border-[rgba(96,150,196,0.16)] shadow-[0_0_0_1px_rgba(96,150,196,0.08),0_30px_90px_rgba(52,80,116,0.16)]",
    },
  },
  violet: {
    gradient: "from-[rgba(150,96,214,0.5)] via-[rgba(84,42,150,0.2)] to-[rgba(190,110,210,0.1)]",
    topLight: "bg-[linear-gradient(180deg,rgba(150,96,214,0.20),rgba(190,110,210,0.05)_55%,rgba(24,24,27,0))]",
    card: {
      surface:
        "border-[rgba(150,96,214,0.18)] shadow-[0_0_0_1px_rgba(150,96,214,0.10),0_28px_80px_rgba(114,65,195,0.20)] hover:border-[rgba(150,96,214,0.32)]",
      mediaShadow: "shadow-[0_0_0_1px_rgba(150,96,214,0.18),0_0_42px_rgba(114,65,195,0.18)]",
    },
    detailHero: {
      surface:
        "border-[rgba(150,96,214,0.18)] shadow-[0_0_0_1px_rgba(150,96,214,0.10),0_30px_90px_rgba(114,65,195,0.22)]",
    },
  },
};

export function getProjectAccentClasses(accent: ProjectAccent) {
  return PROJECT_ACCENT_CLASSES[accent];
}
