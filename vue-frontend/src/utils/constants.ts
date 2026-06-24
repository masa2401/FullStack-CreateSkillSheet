export const CATEGORIES = {
  COMMON: {
    id: 1,
    genre: '共通の質問',
    icon: 'fa-solid fa-briefcase',
  },
  ENGINEER: {
    id: 2,
    genre: 'プログラマ/エンジニア向けの質問',
    icon: 'fa-solid fa-computer',
  },
  DESIGNER: {
    id: 3,
    genre: 'デザイナー(動画制作)向けの質問',
    icon: 'fa-solid fa-palette',
  },
};

export const LEVEL_LABELS = [
  { stars: '★☆☆☆☆', text: '習得が不十分な状態' },
  { stars: '★★☆☆☆', text: '基礎はあるが不安定' },
  { stars: '★★★☆☆', text: '期待どおりにできる' },
  { stars: '★★★★☆', text: '期待以上の成果を出す' },
  { stars: '★★★★★', text: '卓越したレベルで発揮する' },
];

export const ROUTES = {
  TOP: '/',
  SURVEY: '/survey',
  RESULT: '/result',
};
