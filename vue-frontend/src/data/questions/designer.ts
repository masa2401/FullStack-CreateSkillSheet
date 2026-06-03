import type { Question } from '@/types';

export const designerQuestions: Question[] = [
  {
    id: 1,
    questionText:
      'Q1. WebサイトやアプリのUI/UXデザインで使用経験のあるツールを全て選択してください。',
    answers: [
      { label: 'Figma' },
      { label: 'Sketch' },
      { label: 'Adobe XD' },
      { label: 'Procreate (ワイヤーフレーム/ラフ作成など)' },
    ],
  },
  {
    id: 2,
    questionText: 'Q2. イラスト制作を主目的として使用したことのあるツールを全て選択してください。',
    answers: [
      { label: 'Illustrator' },
      { label: 'Photoshop' },
      { label: 'Clip Studio Paint' },
      { label: 'Procreate' },
    ],
  },
  {
    id: 3,
    questionText:
      'Q3. Webデザインの実装（コーディング）において、対応可能なものを全て選択してください。',
    answers: [
      { label: 'HTML/CSSによるコーディング' },
      { label: 'レスポンシブデザイン対応' },
      { label: 'JavaScript (jQuery含む)での簡単なインタラクション実装' },
      { label: 'WordPressのテーマ作成・カスタマイズ' },
    ],
  },
  {
    id: 4,
    questionText: 'Q4. DTP（印刷物）デザインにおいて、経験のある業務を全て選択してください。',
    answers: [
      { label: '名刺・チラシ・ポスターなどの制作' },
      { label: 'パンフレット・冊子などのページレイアウト' },
      { label: '印刷会社への入稿データ作成' },
      { label: '色校正（色味の確認・修正指示）の経験' },
    ],
  },
  {
    id: 5,
    questionText: 'Q5. 実務で使用経験のある動画編集ソフトを全て選択してください。',
    answers: [
      { label: 'Adobe Premiere Pro （カット編集、テロップ入れ、整音など標準的な編集）' },
      { label: 'Adobe After Effects （モーショングラフィックス、VFX、高度なアニメーション作成）' },
      { label: 'Final Cut Pro （Mac環境での編集、カット、トランジション適用など）' },
      { label: 'DaVinci Resolve （カラーグレーディング、色調補正、編集など）' },
      { label: 'CapCut / VLLO など （スマホ・タブレット向けアプリでのショート動画作成）' },
    ],
  },
  {
    id: 6,
    questionText:
      'Q6. 以下の編集スキル・操作について、自信を持って対応できるものを全て選択してください。',
    answers: [
      { label: 'カット編集（ジェットカット、マルチカメラ編集など）' },
      { label: 'テロップ・字幕の挿入（見やすいフォント選定、装飾、タイミング調整）' },
      { label: 'BGM・効果音（SE）の選定・挿入および音量バランスの調整' },
      { label: 'モーショングラフィックスの作成（動くロゴ、タイトルアニメーションなど）' },
      { label: 'キーイング・合成処理（グリーンバック合成、マスク処理など）' },
      { label: 'カラーコレクション・カラーグレーディング（Log撮影データの編集、LUT適用など）' },
      { label: '音声のノイズ除去・整音（環境音の低減、聞き取りやすい音声への加工）' },
    ],
  },
  {
    id: 7,
    questionText:
      'Q7. 動画制作に関連する知識・周辺スキルについて、当てはまるものを全て選択してください。',
    answers: [
      {
        label:
          'サムネイル画像の作成（PhotoshopやCanva等を使用し、クリック率を意識した画像が作れる）',
      },
      {
        label:
          'エンコード・書き出し設定の知識（解像度、フレームレート、コーデック、ビットレートの理解）',
      },
      { label: '動画の構成・台本作成（構成案の作成や、絵コンテの作成が可能）' },
      { label: '撮影機材の基本操作（一眼レフ、照明、マイク等のセッティングと撮影）' },
      { label: '著作権・肖像権に関する基礎知識（BGMや素材サイトの利用規約理解、権利侵害の防止）' },
    ],
  },
  {
    id: 8,
    questionText: 'Q8. これまでに制作・編集経験のある動画ジャンルを選択してください。',
    answers: [
      { label: 'YouTube動画（エンタメ、ビジネス系、Vlogなど）' },
      { label: 'ショート動画（TikTok、Instagram Reels、YouTube Shorts）' },
      { label: '企業プロモーション・商品紹介動画' },
      { label: 'インタビュー・対談動画' },
      { label: 'イベント・ウェディングムービー' },
      { label: 'ゲーム実況動画' },
    ],
  },
];
