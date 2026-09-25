// Chibi Educational Game Avatar System for ITEN (50 Unique Avatars avatar-01 to avatar-50)
import { User } from '../types';

export interface AvatarPreset {
  id: string;
  name: string;
  category: 'male' | 'female' | 'personality' | 'accessory' | 'mascot';
  categoryLabel: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  description: string;
  svgUrl: string;
}

// Helper to generate unique SVGs for all 50 avatars with 2.5D Chibi Educational Game style
function generatePresetSvg(
  idNum: number,
  category: string,
  hairStyle: string,
  hairColor: string,
  skinColor: string,
  shirtColor: string,
  bgGrad: [string, string],
  expression: string,
  accessory: string
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="bg_${idNum}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGrad[0]}" />
          <stop offset="100%" stop-color="${bgGrad[1]}" />
        </linearGradient>
        <linearGradient id="skin_${idNum}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${skinColor}" />
          <stop offset="100%" stop-color="#F3B386" />
        </linearGradient>
        <filter id="shadow_${idNum}" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-opacity="0.2" />
        </filter>
      </defs>

      <!-- Outer Ring & Background -->
      <circle cx="50" cy="50" r="48" fill="url(#bg_${idNum})" stroke="#FFFFFF" stroke-width="2.5" filter="url(#shadow_${idNum})" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="${bgGrad[1]}" stroke-width="1" opacity="0.6" />

      <!-- Body / Clothing -->
      <path d="M24 88 C24 68 35 62 50 62 C65 62 76 68 76 88 Z" fill="${shirtColor}" filter="url(#shadow_${idNum})" />
      
      <!-- Collar / Tie / Details -->
      ${renderShirtDetails(shirtColor, idNum)}

      <!-- Ears -->
      <circle cx="21" cy="44" r="6.5" fill="${skinColor}" />
      <circle cx="79" cy="44" r="6.5" fill="${skinColor}" />
      <circle cx="21" cy="44" r="3.5" fill="#E89874" opacity="0.4" />
      <circle cx="79" cy="44" r="3.5" fill="#E89874" opacity="0.4" />

      <!-- Chibi Head (Round) -->
      <ellipse cx="50" cy="42" rx="28" ry="25.5" fill="url(#skin_${idNum})" filter="url(#shadow_${idNum})" />

      <!-- Blushing Cheeks -->
      <ellipse cx="32" cy="48" rx="5" ry="3.2" fill="#FB7185" opacity="0.5" />
      <ellipse cx="68" cy="48" rx="5" ry="3.2" fill="#FB7185" opacity="0.5" />

      <!-- Eyes according to Expression -->
      ${renderEyes(expression, idNum)}

      <!-- Eyebrows -->
      ${renderBrows(expression, hairColor)}

      <!-- Mouth -->
      ${renderMouth(expression)}

      <!-- Hair Base & Bangs -->
      ${renderHair(hairStyle, hairColor, idNum)}

      <!-- Accessories (Glasses, Headphones, Caps, Clips, Mascot elements) -->
      ${renderAccessory(accessory, idNum)}
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

function renderShirtDetails(shirtColor: string, idNum: number): string {
  if (idNum % 5 === 1) {
    // School Tie
    return `
      <polygon points="50,65 38,62 44,72 50,68 56,72 62,62" fill="#FFFFFF" />
      <polygon points="50,68 53,75 50,85 47,75" fill="#EF4444" />
    `;
  } else if (idNum % 5 === 2) {
    // Hoodie Strings
    return `
      <path d="M42 66 Q38 76 40 82" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="M58 66 Q62 76 60 82" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="M32 64 Q50 72 68 64" fill="none" stroke="#FFFFFF" stroke-width="2.5" />
    `;
  } else if (idNum % 5 === 3) {
    // Sailor / Ribbon
    return `
      <polygon points="50,65 36,62 42,74 50,68 58,74 64,62" fill="#FFFFFF" />
      <circle cx="50" cy="70" r="4" fill="#F43F5E" />
      <polygon points="46,72 54,72 50,82" fill="#F43F5E" />
    `;
  } else if (idNum % 5 === 4) {
    // Sports Jersey Number
    return `
      <polygon points="50,66 38,62 44,72 50,68 56,72 62,62" fill="#FFFFFF" />
      <text x="50" y="82" font-family="Arial" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">10</text>
    `;
  } else {
    // Star Badge Uniform
    return `
      <polygon points="50,65 38,62 44,72 50,68 56,72 62,62" fill="#FFFFFF" />
      <polygon points="50,70 52,74 56,74 53,77 54,81 50,79 46,81 47,77 44,74 48,74" fill="#F59E0B" />
    `;
  }
}

function renderEyes(expression: string, idNum: number): string {
  if (expression === 'wink') {
    return `
      <ellipse cx="36" cy="40" rx="5" ry="6.5" fill="#1E293B" />
      <circle cx="34.5" cy="38" r="2.2" fill="#FFFFFF" />
      <circle cx="37.5" cy="42" r="1.2" fill="#FFFFFF" />
      <!-- Wink Eye -->
      <path d="M58 41 Q64 35 70 41" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />
    `;
  } else if (expression === 'star') {
    return `
      <!-- Left Star Eye -->
      <polygon points="36,34 38,39 43,39 39,42 41,47 36,44 31,47 33,42 29,39 34,39" fill="#F59E0B" />
      <!-- Right Star Eye -->
      <polygon points="64,34 66,39 71,39 67,42 69,47 64,44 59,47 61,42 57,39 62,39" fill="#F59E0B" />
    `;
  } else if (expression === 'happy_arc') {
    return `
      <path d="M30 42 Q36 34 42 42" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M58 42 Q64 34 70 42" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />
    `;
  } else if (expression === 'thinking') {
    return `
      <ellipse cx="36" cy="38" rx="5" ry="6" fill="#1E293B" />
      <circle cx="34.5" cy="36" r="2" fill="#FFFFFF" />
      <ellipse cx="64" cy="38" rx="5" ry="6" fill="#1E293B" />
      <circle cx="62.5" cy="36" r="2" fill="#FFFFFF" />
    `;
  } else {
    // Normal big sparkling chibi eyes
    return `
      <ellipse cx="36" cy="40" rx="5" ry="6.5" fill="#1E293B" />
      <circle cx="34.5" cy="38" r="2.2" fill="#FFFFFF" />
      <circle cx="37.5" cy="42" r="1.2" fill="#FFFFFF" />
      <ellipse cx="64" cy="40" rx="5" ry="6.5" fill="#1E293B" />
      <circle cx="62.5" cy="38" r="2.2" fill="#FFFFFF" />
      <circle cx="65.5" cy="42" r="1.2" fill="#FFFFFF" />
    `;
  }
}

function renderBrows(expression: string, hairColor: string): string {
  if (expression === 'thinking') {
    return `
      <path d="M31 31 Q36 28 41 33" stroke="${hairColor}" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M59 33 Q64 28 69 31" stroke="${hairColor}" stroke-width="2" stroke-linecap="round" fill="none" />
    `;
  }
  return `
    <path d="M31 32 Q36 29 41 32" stroke="${hairColor}" stroke-width="2" stroke-linecap="round" fill="none" />
    <path d="M59 32 Q64 29 69 32" stroke="${hairColor}" stroke-width="2" stroke-linecap="round" fill="none" />
  `;
}

function renderMouth(expression: string): string {
  if (expression === 'tongue') {
    return `
      <path d="M44 48 Q50 56 56 48 Z" fill="#E11D48" stroke="#1E293B" stroke-width="1.5" />
      <path d="M47 51 Q50 56 53 51" fill="#FB7185" />
    `;
  } else if (expression === 'wink') {
    return `
      <path d="M45 47 Q50 53 55 47" stroke="#E11D48" stroke-width="2.5" stroke-linecap="round" fill="#F43F5E" />
    `;
  } else if (expression === 'thinking') {
    return `
      <path d="M46 51 Q50 49 54 51" stroke="#E11D48" stroke-width="2" stroke-linecap="round" fill="none" />
    `;
  } else {
    return `
      <path d="M45 48 Q50 54 55 48" stroke="#E11D48" stroke-width="2" stroke-linecap="round" fill="#F43F5E" />
      <circle cx="50" cy="44" r="1.2" fill="#E07A5F" />
    `;
  }
}

function renderHair(hairStyle: string, hairColor: string, idNum: number): string {
  if (hairStyle === 'spiky') {
    return `
      <path d="M22 36 C18 18 28 8 50 8 C72 8 82 18 78 36 C74 22 64 20 50 20 C36 20 26 22 22 36 Z" fill="${hairColor}" />
      <path d="M24 26 L30 12 L38 22 L48 10 L56 22 L66 12 L72 26 Z" fill="${hairColor}" />
      <path d="M28 28 Q50 36 72 28 Q60 22 50 22 Q40 22 28 28 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'twintails') {
    return `
      <path d="M20 36 C16 18 30 10 50 10 C70 10 84 18 80 36 C74 22 62 20 50 20 C38 20 26 22 20 36 Z" fill="${hairColor}" />
      <path d="M16 34 C8 46 10 64 20 66 C18 52 20 42 22 34 Z" fill="${hairColor}" />
      <path d="M84 34 C92 46 90 64 80 66 C82 52 80 42 78 34 Z" fill="${hairColor}" />
      <path d="M28 28 Q50 36 72 28 Q60 22 50 22 Q40 22 28 28 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'curly') {
    return `
      <circle cx="28" cy="22" r="12" fill="${hairColor}" />
      <circle cx="40" cy="14" r="13" fill="${hairColor}" />
      <circle cx="58" cy="14" r="13" fill="${hairColor}" />
      <circle cx="72" cy="22" r="12" fill="${hairColor}" />
      <circle cx="22" cy="34" r="10" fill="${hairColor}" />
      <circle cx="78" cy="34" r="10" fill="${hairColor}" />
      <path d="M28 28 Q50 34 72 28 Q60 22 50 22 Q40 22 28 28 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'bun') {
    return `
      <path d="M22 36 C18 18 30 10 50 10 C70 10 82 18 78 36 C72 22 62 20 50 20 C38 20 28 22 22 36 Z" fill="${hairColor}" />
      <circle cx="50" cy="9" r="11" fill="${hairColor}" />
      <path d="M28 28 Q50 35 72 28 Q60 22 50 22 Q40 22 28 28 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'bob') {
    return `
      <path d="M20 36 C16 18 30 10 50 10 C70 10 84 18 80 36 C76 56 70 58 68 58 L32 58 C30 58 24 56 20 36 Z" fill="${hairColor}" />
      <path d="M28 28 Q50 35 72 28 Q60 22 50 22 Q40 22 28 28 Z" fill="${hairColor}" />
    `;
  } else {
    // Side part sleek hair
    return `
      <path d="M22 36 C18 18 30 10 50 10 C70 10 82 18 78 36 C72 22 62 20 50 20 C38 20 28 22 22 36 Z" fill="${hairColor}" />
      <path d="M26 26 C36 18 52 18 74 26 C62 22 46 22 26 26 Z" fill="${hairColor}" />
      <path d="M28 28 Q50 35 72 28 Q60 22 50 22 Q40 22 28 28 Z" fill="${hairColor}" />
    `;
  }
}

function renderAccessory(accessory: string, idNum: number): string {
  if (accessory === 'glasses') {
    return `
      <rect x="27" y="33" width="18" height="14" rx="4" fill="none" stroke="#0284C7" stroke-width="2.2" />
      <rect x="55" y="33" width="18" height="14" rx="4" fill="none" stroke="#0284C7" stroke-width="2.2" />
      <line x1="45" y1="40" x2="55" y2="40" stroke="#0284C7" stroke-width="2.2" />
    `;
  } else if (accessory === 'round_glasses') {
    return `
      <circle cx="36" cy="40" r="9" fill="none" stroke="#D97706" stroke-width="2" />
      <circle cx="64" cy="40" r="9" fill="none" stroke="#D97706" stroke-width="2" />
      <line x1="45" y1="40" x2="55" y2="40" stroke="#D97706" stroke-width="2" />
    `;
  } else if (accessory === 'headphones') {
    return `
      <path d="M18 42 C18 16 82 16 82 42" fill="none" stroke="#F43F5E" stroke-width="4" stroke-linecap="round" />
      <rect x="12" y="34" width="8" height="18" rx="4" fill="#E11D48" />
      <rect x="80" y="34" width="8" height="18" rx="4" fill="#E11D48" />
    `;
  } else if (accessory === 'cap') {
    return `
      <path d="M24 24 C24 10 76 10 76 24 Z" fill="#F59E0B" />
      <path d="M20 24 L80 24 L84 28 L16 28 Z" fill="#D97706" />
      <circle cx="50" cy="10" r="3" fill="#B45309" />
    `;
  } else if (accessory === 'flower_clip') {
    return `
      <circle cx="28" cy="22" r="5" fill="#F472B6" />
      <circle cx="25" cy="19" r="3" fill="#F472B6" />
      <circle cx="31" cy="19" r="3" fill="#F472B6" />
      <circle cx="25" cy="25" r="3" fill="#F472B6" />
      <circle cx="31" cy="25" r="3" fill="#F472B6" />
      <circle cx="28" cy="22" r="2.5" fill="#FEF08A" />
    `;
  } else if (accessory === 'cat_ears') {
    return `
      <polygon points="24,20 18,6 34,16" fill="#EC4899" stroke="#BE185D" stroke-width="1.5" />
      <polygon points="24,18 20,9 31,15" fill="#FBCFE8" />
      <polygon points="76,20 82,6 66,16" fill="#EC4899" stroke="#BE185D" stroke-width="1.5" />
      <polygon points="76,18 80,9 69,15" fill="#FBCFE8" />
    `;
  } else if (accessory === 'backpack') {
    return `
      <path d="M72 58 Q82 64 80 82" stroke="#3B82F6" stroke-width="5" fill="none" stroke-linecap="round" />
      <rect x="74" y="62" width="12" height="20" rx="3" fill="#2563EB" />
    `;
  } else if (accessory === 'book') {
    return `
      <rect x="10" y="60" width="16" height="22" rx="2" fill="#10B981" stroke="#047857" stroke-width="1.5" transform="rotate(-15 18 70)" />
      <line x1="14" y1="64" x2="22" y2="62" stroke="#FFFFFF" stroke-width="2" transform="rotate(-15 18 70)" />
    `;
  } else if (accessory === 'robot_helmet') {
    return `
      <polygon points="50,4 53,10 59,10 54,14 56,20 50,16 44,20 46,14 41,10 47,10" fill="#F59E0B" />
      <rect x="22" y="24" width="56" height="12" rx="4" fill="#38BDF8" opacity="0.4" />
    `;
  } else if (accessory === 'wizard_hat') {
    return `
      <polygon points="50,2 32,24 68,24" fill="#8B5CF6" />
      <ellipse cx="50" cy="24" rx="24" ry="5" fill="#7C3AED" />
      <polygon points="50,8 52,12 56,12 53,15 54,19 50,17 46,19 47,15 44,12 48,12" fill="#FDE047" />
    `;
  } else {
    // Subtle sparkle icon or star badge
    return `
      <circle cx="75" cy="22" r="3" fill="#F59E0B" />
      <circle cx="25" cy="20" r="2" fill="#F59E0B" />
    `;
  }
}

// Build 50 Unique Preset Avatars!
export const AVATAR_PRESETS_50: AvatarPreset[] = [
  // 01-10: Học sinh nam chibi
  {
    id: 'avatar-01',
    name: 'Nam Sinh Đeo Balo',
    category: 'male',
    categoryLabel: 'Học sinh nam',
    gender: 'Nam',
    description: 'Nam sinh năng động, sẵn sàng cho mỗi buổi học mới.',
    svgUrl: generatePresetSvg(1, 'male', 'sidepart', '#2C1B18', '#FFDFC4', '#38BDF8', ['#E0F2FE', '#BAE6FD'], 'smile', 'backpack')
  },
  {
    id: 'avatar-02',
    name: 'Nam Sinh Kính Tri Thức',
    category: 'male',
    categoryLabel: 'Học sinh nam',
    gender: 'Nam',
    description: 'Chàng trai đam mê đọc sách và giải toán nhanh.',
    svgUrl: generatePresetSvg(2, 'male', 'sidepart', '#3D2314', '#FFE5D4', '#34D399', ['#D1FAE5', '#A7F3D0'], 'thinking', 'glasses')
  },
  {
    id: 'avatar-03',
    name: 'Nam Sinh Mũ Lưỡi Trai',
    category: 'male',
    categoryLabel: 'Học sinh nam',
    gender: 'Nam',
    description: 'Phong cách cá tính, yêu thích các hoạt động ngoài trời.',
    svgUrl: generatePresetSvg(3, 'male', 'spiky', '#1F1A17', '#F0CBB0', '#FB923C', ['#FFEDD5', '#FED7AA'], 'wink', 'cap')
  },
  {
    id: 'avatar-04',
    name: 'Nam Sinh Cầm Sách',
    category: 'male',
    categoryLabel: 'Học sinh nam',
    gender: 'Nam',
    description: 'Học sinh giỏi luôn mang theo cuốn sổ tay ghi chép.',
    svgUrl: generatePresetSvg(4, 'male', 'sidepart', '#4A3728', '#FFDFC4', '#818CF8', ['#E0E7FF', '#C7D2FE'], 'smile', 'book')
  },
  {
    id: 'avatar-05',
    name: 'Nam Sinh Thể Thao',
    category: 'male',
    categoryLabel: 'Học sinh nam',
    gender: 'Nam',
    description: 'Đội trưởng đội bóng rổ tràn đầy nhiệt huyết.',
    svgUrl: generatePresetSvg(5, 'male', 'spiky', '#2C1B18', '#F8D9C0', '#EF4444', ['#FEE2E2', '#FECACA'], 'happy_arc', 'none')
  },
  {
    id: 'avatar-06',
    name: 'Nam Sinh Tóc Xoăn Bồng',
    category: 'male',
    categoryLabel: 'Học sinh nam',
    gender: 'Nam',
    description: 'Cậu bạn dí dỏm, luôn làm cả lớp bật cười.',
    svgUrl: generatePresetSvg(6, 'male', 'curly', '#3D2314', '#FFE5D4', '#10B981', ['#E6F4EA', '#CEEAD6'], 'tongue', 'none')
  },
  {
    id: 'avatar-07',
    name: 'Nam Sinh Cà Vạt Đỏ',
    category: 'male',
    categoryLabel: 'Học sinh nam',
    gender: 'Nam',
    description: 'Thành viên ban chỉ huy chi đoàn chỉn chu.',
    svgUrl: generatePresetSvg(7, 'male', 'sidepart', '#1F1A17', '#FFDFC4', '#3B82F6', ['#DBEAFE', '#BFDBFE'], 'smile', 'none')
  },
  {
    id: 'avatar-08',
    name: 'Nam Sinh Tai Nghe Nhạc',
    category: 'male',
    categoryLabel: 'Học sinh nam',
    gender: 'Nam',
    description: 'Yêu âm nhạc và vừa nghe nhạc vừa ôn bài.',
    svgUrl: generatePresetSvg(8, 'male', 'spiky', '#5C4033', '#F0CBB0', '#8B5CF6', ['#F3E8FF', '#E9D5FF'], 'smile', 'headphones')
  },
  {
    id: 'avatar-09',
    name: 'Nam Sinh Kính Tròn',
    category: 'male',
    categoryLabel: 'Học sinh nam',
    gender: 'Nam',
    description: 'Thiên tài tin học lớp 12A.',
    svgUrl: generatePresetSvg(9, 'male', 'sidepart', '#2C1B18', '#FFE5D4', '#0EA5E9', ['#E0F2FE', '#BAE6FD'], 'thinking', 'round_glasses')
  },
  {
    id: 'avatar-10',
    name: 'Nam Sinh Áo Hoodie',
    category: 'male',
    categoryLabel: 'Học sinh nam',
    gender: 'Nam',
    description: 'Phong cách ấm áp, điềm tĩnh và thông minh.',
    svgUrl: generatePresetSvg(10, 'male', 'spiky', '#3D2314', '#FFDFC4', '#F59E0B', ['#FEF3C7', '#FDE68A'], 'smile', 'none')
  },

  // 11-20: Học sinh nữ chibi
  {
    id: 'avatar-11',
    name: 'Nữ Sinh Bính Tóc Đôi',
    category: 'female',
    categoryLabel: 'Học sinh nữ',
    gender: 'Nữ',
    description: 'Cô bạn thắt nơ xinh xắn, bạn thân lớp phó.',
    svgUrl: generatePresetSvg(11, 'female', 'twintails', '#3D2314', '#FFDFC4', '#F472B6', ['#FCE7F3', '#FBCFE8'], 'smile', 'flower_clip')
  },
  {
    id: 'avatar-12',
    name: 'Nữ Sinh Kính Tri Thức',
    category: 'female',
    categoryLabel: 'Học sinh nữ',
    gender: 'Nữ',
    description: 'Lớp phó học tập chăm chỉ và nhiệt tình giúp đỡ bạn bè.',
    svgUrl: generatePresetSvg(12, 'female', 'bob', '#2C1B18', '#FFE5D4', '#38BDF8', ['#E0F2FE', '#BAE6FD'], 'smile', 'glasses')
  },
  {
    id: 'avatar-13',
    name: 'Nữ Sinh Búi Tóc Cao',
    category: 'female',
    categoryLabel: 'Học sinh nữ',
    gender: 'Nữ',
    description: 'Cô gái năng động, giỏi vũ đạo và phong trào.',
    svgUrl: generatePresetSvg(13, 'female', 'bun', '#1F1A17', '#F8D9C0', '#A855F7', ['#F3E8FF', '#E9D5FF'], 'wink', 'none')
  },
  {
    id: 'avatar-14',
    name: 'Nữ Sinh Tóc Ngắn Bob',
    category: 'female',
    categoryLabel: 'Học sinh nữ',
    gender: 'Nữ',
    description: 'Phong cách cá tính, tươi tắn và dễ thương.',
    svgUrl: generatePresetSvg(14, 'female', 'bob', '#5C4033', '#FFDFC4', '#34D399', ['#D1FAE5', '#A7F3D0'], 'happy_arc', 'none')
  },
  {
    id: 'avatar-15',
    name: 'Nữ Sinh Bờm Tai Mèo',
    category: 'female',
    categoryLabel: 'Học sinh nữ',
    gender: 'Nữ',
    description: 'Cực kỳ đáng yêu, yêu thích mèo và vẽ tranh.',
    svgUrl: generatePresetSvg(15, 'female', 'twintails', '#3D2314', '#FFE5D4', '#EC4899', ['#FCE7F3', '#FBCFE8'], 'smile', 'cat_ears')
  },
  {
    id: 'avatar-16',
    name: 'Nữ Sinh Cầm Sách',
    category: 'female',
    categoryLabel: 'Học sinh nữ',
    gender: 'Nữ',
    description: 'Hội viên CLB Sách ITEN luôn tìm tòi kiến thức mới.',
    svgUrl: generatePresetSvg(16, 'female', 'bob', '#2C1B18', '#FFDFC4', '#10B981', ['#E6F4EA', '#CEEAD6'], 'thinking', 'book')
  },
  {
    id: 'avatar-17',
    name: 'Nữ Sinh Tai Nghe Hồng',
    category: 'female',
    categoryLabel: 'Học sinh nữ',
    gender: 'Nữ',
    description: 'Thích vừa học bài vừa thưởng thức âm nhạc.',
    svgUrl: generatePresetSvg(17, 'female', 'twintails', '#4A3728', '#FFE5D4', '#F43F5E', ['#FFE4E6', '#FECDD3'], 'smile', 'headphones')
  },
  {
    id: 'avatar-18',
    name: 'Nữ Sinh Tóc Xoăn Lọn',
    category: 'female',
    categoryLabel: 'Học sinh nữ',
    gender: 'Nữ',
    description: 'Cô bạn dịu dàng, luôn nở nụ cười ấm áp.',
    svgUrl: generatePresetSvg(18, 'female', 'curly', '#3D2314', '#F8D9C0', '#F59E0B', ['#FEF3C7', '#FDE68A'], 'smile', 'none')
  },
  {
    id: 'avatar-19',
    name: 'Nữ Sinh Mũ Lưỡi Trai Hồng',
    category: 'female',
    categoryLabel: 'Học sinh nữ',
    gender: 'Nữ',
    description: 'Năng nổ trong các hoạt động thể thao trường.',
    svgUrl: generatePresetSvg(19, 'female', 'twintails', '#1F1A17', '#FFDFC4', '#FB923C', ['#FFEDD5', '#FED7AA'], 'wink', 'cap')
  },
  {
    id: 'avatar-20',
    name: 'Nữ Sinh Kính Tròn Xinh',
    category: 'female',
    categoryLabel: 'Học sinh nữ',
    gender: 'Nữ',
    description: 'Cô bạn thông minh, tinh ý và luôn có giải pháp hay.',
    svgUrl: generatePresetSvg(20, 'female', 'bun', '#2C1B18', '#FFE5D4', '#6366F1', ['#EEF2FF', '#E0E7FF'], 'star', 'round_glasses')
  },

  // 21-30: Nhân vật chibi cá tính / hài hước
  {
    id: 'avatar-21',
    name: 'Chibi Nháy Mắt Tinh Tinh',
    category: 'personality',
    categoryLabel: 'Cá tính & Hài hước',
    gender: 'Khác',
    description: 'Luôn tràn đầy năng lượng tích cực và may mắn.',
    svgUrl: generatePresetSvg(21, 'personality', 'spiky', '#3D2314', '#FFDFC4', '#FBBF24', ['#FEF3C7', '#FDE68A'], 'wink', 'none')
  },
  {
    id: 'avatar-22',
    name: 'Chibi Lè Lưỡi Dí Dỏm',
    category: 'personality',
    categoryLabel: 'Cá tính & Hài hước',
    gender: 'Khác',
    description: 'Vua trò đùa dễ thương của cả lớp.',
    svgUrl: generatePresetSvg(22, 'personality', 'curly', '#2C1B18', '#F0CBB0', '#10B981', ['#D1FAE5', '#A7F3D0'], 'tongue', 'none')
  },
  {
    id: 'avatar-23',
    name: 'Chibi Mắt Ngôi Sao',
    category: 'personality',
    categoryLabel: 'Cá tính & Hài hước',
    gender: 'Khác',
    description: 'Mỗi khi nghĩ ra ý tưởng xuất sắc, mắt sáng lên sao.',
    svgUrl: generatePresetSvg(23, 'personality', 'spiky', '#1F1A17', '#FFDFC4', '#8B5CF6', ['#F3E8FF', '#E9D5FF'], 'star', 'none')
  },
  {
    id: 'avatar-24',
    name: 'Chibi Đang Suy Nghĩ (Thinking)',
    category: 'personality',
    categoryLabel: 'Cá tính & Hài hước',
    gender: 'Khác',
    description: 'Đang tập trung giải câu hỏi khó để nâng điểm.',
    svgUrl: generatePresetSvg(24, 'personality', 'sidepart', '#4A3728', '#FFE5D4', '#38BDF8', ['#E0F2FE', '#BAE6FD'], 'thinking', 'none')
  },
  {
    id: 'avatar-25',
    name: 'Chibi Balo Béo',
    category: 'personality',
    categoryLabel: 'Cá tính & Hài hước',
    gender: 'Khác',
    description: 'Balo đầy ắp tài liệu học tập và đồ ăn nhẹ.',
    svgUrl: generatePresetSvg(25, 'personality', 'twintails', '#3D2314', '#FFDFC4', '#F472B6', ['#FCE7F3', '#FBCFE8'], 'smile', 'backpack')
  },
  {
    id: 'avatar-26',
    name: 'Chibi Hoodie Mèo Nâu',
    category: 'personality',
    categoryLabel: 'Cá tính & Hài hước',
    gender: 'Khác',
    description: 'Chiếc áo hoodie ấm áp yêu thích.',
    svgUrl: generatePresetSvg(26, 'personality', 'bob', '#2C1B18', '#F8D9C0', '#FB923C', ['#FFEDD5', '#FED7AA'], 'happy_arc', 'none')
  },
  {
    id: 'avatar-27',
    name: 'Chibi Chiến Thắng',
    category: 'personality',
    categoryLabel: 'Cá tính & Hài hước',
    gender: 'Khác',
    description: 'Quyết tâm dẫn đầu bảng xếp hạng thi đua.',
    svgUrl: generatePresetSvg(27, 'personality', 'spiky', '#5C4033', '#FFDFC4', '#EF4444', ['#FEE2E2', '#FECACA'], 'star', 'none')
  },
  {
    id: 'avatar-28',
    name: 'Chibi Tóc Tím Pastel',
    category: 'personality',
    categoryLabel: 'Cá tính & Hài hước',
    gender: 'Khác',
    description: 'Cá tính nghệ thuật độc đáo và sáng tạo.',
    svgUrl: generatePresetSvg(28, 'personality', 'twintails', '#A855F7', '#FFE5D4', '#EC4899', ['#FCE7F3', '#FBCFE8'], 'wink', 'flower_clip')
  },
  {
    id: 'avatar-29',
    name: 'Chibi Kính Râm Cool',
    category: 'personality',
    categoryLabel: 'Cá tính & Hài hước',
    gender: 'Khác',
    description: 'Thần thái đỉnh cao trước mỗi trận thi đua.',
    svgUrl: generatePresetSvg(29, 'personality', 'spiky', '#1F1A17', '#FFDFC4', '#1E293B', ['#F1F5F9', '#E2E8F0'], 'smile', 'glasses')
  },
  {
    id: 'avatar-30',
    name: 'Chibi Cười Rạng Rỡ',
    category: 'personality',
    categoryLabel: 'Cá tính & Hài hước',
    gender: 'Khác',
    description: 'Mang lại tiếng cười và sự thoải mái cho bạn học.',
    svgUrl: generatePresetSvg(30, 'personality', 'curly', '#3D2314', '#F8D9C0', '#F59E0B', ['#FEF3C7', '#FDE68A'], 'happy_arc', 'none')
  },

  // 31-40: Phụ kiện đặc biệt
  {
    id: 'avatar-31',
    name: 'Gamer Tai Nghe Đỏ',
    category: 'accessory',
    categoryLabel: 'Phụ kiện Độc đáo',
    gender: 'Khác',
    description: 'Cao thủ game trí tuệ ITEN Keyboard Hero.',
    svgUrl: generatePresetSvg(31, 'accessory', 'spiky', '#2C1B18', '#FFDFC4', '#EF4444', ['#FEE2E2', '#FECACA'], 'smile', 'headphones')
  },
  {
    id: 'avatar-32',
    name: 'Mũ Lưỡi Trai Cam',
    category: 'accessory',
    categoryLabel: 'Phụ kiện Độc đáo',
    gender: 'Khác',
    description: 'Đội mũ phong cách hiphop cực chất.',
    svgUrl: generatePresetSvg(32, 'accessory', 'sidepart', '#1F1A17', '#F0CBB0', '#F59E0B', ['#FEF3C7', '#FDE68A'], 'wink', 'cap')
  },
  {
    id: 'avatar-33',
    name: 'Mèo Chibi Bờm Hồng',
    category: 'accessory',
    categoryLabel: 'Phụ kiện Độc đáo',
    gender: 'Khác',
    description: 'Đeo bờm tai mèo vô cùng ngọt ngào.',
    svgUrl: generatePresetSvg(33, 'accessory', 'twintails', '#3D2314', '#FFE5D4', '#F472B6', ['#FCE7F3', '#FBCFE8'], 'smile', 'cat_ears')
  },
  {
    id: 'avatar-34',
    name: 'Đeo Balo Xanh Biển',
    category: 'accessory',
    categoryLabel: 'Phụ kiện Độc đáo',
    gender: 'Khác',
    description: 'Hành trang sẵn sàng chinh phục tri thức.',
    svgUrl: generatePresetSvg(34, 'accessory', 'spiky', '#4A3728', '#FFDFC4', '#3B82F6', ['#DBEAFE', '#BFDBFE'], 'smile', 'backpack')
  },
  {
    id: 'avatar-35',
    name: 'Tay Cầm Sách Xanh',
    category: 'accessory',
    categoryLabel: 'Phụ kiện Độc đáo',
    gender: 'Khác',
    description: 'Lúc nào cũng ham học và đọc sách.',
    svgUrl: generatePresetSvg(35, 'accessory', 'bob', '#2C1B18', '#FFE5D4', '#10B981', ['#D1FAE5', '#A7F3D0'], 'thinking', 'book')
  },
  {
    id: 'avatar-36',
    name: 'Kính Râm Thời Trang',
    category: 'accessory',
    categoryLabel: 'Phụ kiện Độc đáo',
    gender: 'Khác',
    description: 'Sành điệu và tự tin phát biểu.',
    svgUrl: generatePresetSvg(36, 'accessory', 'sidepart', '#3D2314', '#F8D9C0', '#8B5CF6', ['#F3E8FF', '#E9D5FF'], 'smile', 'glasses')
  },
  {
    id: 'avatar-37',
    name: 'Cài Hoa Anh Đào',
    category: 'accessory',
    categoryLabel: 'Phụ kiện Độc đáo',
    gender: 'Khác',
    description: 'Cặp tóc hoa anh đào rạng rỡ.',
    svgUrl: generatePresetSvg(37, 'accessory', 'bun', '#1F1A17', '#FFE5D4', '#EC4899', ['#FCE7F3', '#FBCFE8'], 'smile', 'flower_clip')
  },
  {
    id: 'avatar-38',
    name: 'Mũ Phù Thủy Học Thuật',
    category: 'accessory',
    categoryLabel: 'Phụ kiện Độc đáo',
    gender: 'Khác',
    description: 'Phù thủy công nghệ hóa giải mọi bài toán.',
    svgUrl: generatePresetSvg(38, 'accessory', 'twintails', '#8B5CF6', '#FFDFC4', '#7C3AED', ['#F3E8FF', '#E9D5FF'], 'star', 'wizard_hat')
  },
  {
    id: 'avatar-39',
    name: 'Astro Robot Helmet',
    category: 'accessory',
    categoryLabel: 'Phụ kiện Độc đáo',
    gender: 'Khác',
    description: 'Phi hành gia tương lai bay vào không gian trí tuệ.',
    svgUrl: generatePresetSvg(39, 'accessory', 'spiky', '#38BDF8', '#FFE5D4', '#0284C7', ['#E0F2FE', '#BAE6FD'], 'smile', 'robot_helmet')
  },
  {
    id: 'avatar-40',
    name: 'Kính Tròn Tri Thức Vàng',
    category: 'accessory',
    categoryLabel: 'Phụ kiện Độc đáo',
    gender: 'Khác',
    description: 'Mắt kính vàng óng tinh anh.',
    svgUrl: generatePresetSvg(40, 'accessory', 'curly', '#2C1B18', '#FFE5D4', '#F59E0B', ['#FEF3C7', '#FDE68A'], 'smile', 'round_glasses')
  },

  // 41-50: Vui nhộn / Mascot / Educational Game characters
  {
    id: 'avatar-41',
    name: 'Mascot Robot ITEN Astro',
    category: 'mascot',
    categoryLabel: 'Mascot & Game',
    gender: 'Khác',
    description: 'Chú Robot Mascot thông minh đồng hành cùng học sinh.',
    svgUrl: generatePresetSvg(41, 'mascot', 'spiky', '#0284C7', '#E0F2FE', '#3B82F6', ['#FEF3C7', '#FDE68A'], 'smile', 'robot_helmet')
  },
  {
    id: 'avatar-42',
    name: 'Chibi Phù Thủy Tri Thức',
    category: 'mascot',
    categoryLabel: 'Mascot & Game',
    gender: 'Khác',
    description: 'Sở hữu phép thuật giải đố thần tốc.',
    svgUrl: generatePresetSvg(42, 'mascot', 'twintails', '#7C3AED', '#FFE5D4', '#A855F7', ['#F3E8FF', '#E9D5FF'], 'star', 'wizard_hat')
  },
  {
    id: 'avatar-43',
    name: 'Chibi Siêu Nhân Lớp Học',
    category: 'mascot',
    categoryLabel: 'Mascot & Game',
    gender: 'Khác',
    description: 'Cứu nguy các bài tập khó cho nhóm.',
    svgUrl: generatePresetSvg(43, 'mascot', 'spiky', '#EF4444', '#FFDFC4', '#DC2626', ['#FEE2E2', '#FECACA'], 'star', 'none')
  },
  {
    id: 'avatar-44',
    name: 'Chibi Mèo Vũ Truyền Tin',
    category: 'mascot',
    categoryLabel: 'Mascot & Game',
    gender: 'Khác',
    description: 'Sứ giả tin nhắn năng động của lớp.',
    svgUrl: generatePresetSvg(44, 'mascot', 'twintails', '#EC4899', '#FFE5D4', '#F472B6', ['#FCE7F3', '#FBCFE8'], 'wink', 'cat_ears')
  },
  {
    id: 'avatar-45',
    name: 'Chibi Thiên Tài Tin Học',
    category: 'mascot',
    categoryLabel: 'Mascot & Game',
    gender: 'Khác',
    description: 'Lập trình viên nhí cực đỉnh.',
    svgUrl: generatePresetSvg(45, 'mascot', 'sidepart', '#1F1A17', '#F8D9C0', '#10B981', ['#D1FAE5', '#A7F3D0'], 'thinking', 'glasses')
  },
  {
    id: 'avatar-46',
    name: 'Chibi Ngôi Sao Thi Đua',
    category: 'mascot',
    categoryLabel: 'Mascot & Game',
    gender: 'Khác',
    description: 'Sở hữu nhiều điểm thưởng hoa học tập nhất.',
    svgUrl: generatePresetSvg(46, 'mascot', 'spiky', '#F59E0B', '#FFDFC4', '#D97706', ['#FEF3C7', '#FDE68A'], 'star', 'none')
  },
  {
    id: 'avatar-47',
    name: 'Chibi Âm Nhạc Yêu Đời',
    category: 'mascot',
    categoryLabel: 'Mascot & Game',
    gender: 'Khác',
    description: 'Mang giai điệu vui tươi đến cho từng tiết học.',
    svgUrl: generatePresetSvg(47, 'mascot', 'curly', '#3D2314', '#FFE5D4', '#8B5CF6', ['#F3E8FF', '#E9D5FF'], 'happy_arc', 'headphones')
  },
  {
    id: 'avatar-48',
    name: 'Chibi Tay Lái Đường Đua',
    category: 'mascot',
    categoryLabel: 'Mascot & Game',
    gender: 'Khác',
    description: 'Tay đua vô địch trong Đường đua học tập ITEN.',
    svgUrl: generatePresetSvg(48, 'mascot', 'spiky', '#2C1B18', '#F0CBB0', '#EF4444', ['#FEE2E2', '#FECACA'], 'wink', 'cap')
  },
  {
    id: 'avatar-49',
    name: 'Chibi Thần Đồng Khảo Cứu',
    category: 'mascot',
    categoryLabel: 'Mascot & Game',
    gender: 'Khác',
    description: 'Nhà thám hiểm kho tàng kiến thức.',
    svgUrl: generatePresetSvg(49, 'mascot', 'bob', '#5C4033', '#FFDFC4', '#059669', ['#D1FAE5', '#A7F3D0'], 'smile', 'book')
  },
  {
    id: 'avatar-50',
    name: 'Chibi ITEN Golden Hero',
    category: 'mascot',
    categoryLabel: 'Mascot & Game',
    gender: 'Khác',
    description: 'Học sinh xuất sắc nhất giải thưởng ITEN!',
    svgUrl: generatePresetSvg(50, 'mascot', 'spiky', '#D97706', '#FFDFC4', '#F59E0B', ['#FEF3C7', '#FDE68A'], 'star', 'wizard_hat')
  }
];

// Helper to resolve an avatar object or SVG string from a user object
export function getAvatarById(avatarId?: string): AvatarPreset {
  if (avatarId) {
    const found = AVATAR_PRESETS_50.find(a => a.id === avatarId);
    if (found) return found;
  }
  // Default fallback avatar-01
  return AVATAR_PRESETS_50[0];
}

export function getAvatarUrl(user?: Partial<User> | null): string {
  if (!user) return AVATAR_PRESETS_50[0].svgUrl;

  // 1. Check direct avatarId mapping first
  if (user.avatarId) {
    const found = AVATAR_PRESETS_50.find(a => a.id === user.avatarId);
    if (found) return found.svgUrl;
  }

  // 2. If user already has a valid inline SVG or external image URL
  if (user.avatar && (user.avatar.startsWith('data:image') || user.avatar.startsWith('http'))) {
    return user.avatar;
  }

  // 3. Fallback to deterministic generator based on name / gender
  const name = user.fullName || user.username || 'Student';
  const role = user.role || 'student';
  const gender = user.gender || 'Nam';

  // Seed based index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % AVATAR_PRESETS_50.length;
  return AVATAR_PRESETS_50[idx].svgUrl;
}

// Keep legacy fallback for backwards compatibility
export function getChibiAvatarUrl(name: string, role: string = 'student', gender: string = 'Nam'): string {
  return getAvatarUrl({ fullName: name, role: role as any, gender: gender as any });
}
