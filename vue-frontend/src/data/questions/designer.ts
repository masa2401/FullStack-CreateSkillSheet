import type { Question } from '@/types'

export const designerQuestions: Question[] = [
  {
    id: 1,
    title: 'UI/UXデザインツール',
    prompt: '実務で使用経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'Figma' },
      { id: 2, label: 'Sketch' },
      { id: 3, label: 'Adobe XD' },
      { id: 4, label: 'Procreate (ワイヤーフレーム/ラフ作成など)' },
    ],
  },
  {
    id: 2,
    title: 'イラスト制作ツール',
    prompt: '主目的として使用したことのあるものを選択してください。',
    answers: [
      { id: 1, label: 'Illustrator' },
      { id: 2, label: 'Photoshop' },
      { id: 3, label: 'Clip Studio Paint' },
      { id: 4, label: 'Procreate' },
    ],
  },
  {
    id: 3,
    title: 'Webデザイン実装',
    prompt: '対応可能なものを選択してください。',
    answers: [
      { id: 1, label: 'HTML/CSSによるコーディング' },
      { id: 2, label: 'レスポンシブデザイン対応' },
      { id: 3, label: 'JavaScript (jQuery含む)での簡単なインタラクション実装' },
      { id: 4, label: 'WordPressのテーマ作成・カスタマイズ' },
    ],
  },
  {
    id: 4,
    title: 'DTP・印刷物デザイン',
    prompt: '経験のある業務を選択してください。',
    answers: [
      { id: 1, label: '名刺・チラシ・ポスターなどの制作' },
      { id: 2, label: 'パンフレット・冊子などのページレイアウト' },
      { id: 3, label: '印刷会社への入稿データ作成' },
      { id: 4, label: '色校正（色味の確認・修正指示）の経験' },
    ],
  },
  {
    id: 5,
    title: '動画編集ソフト',
    prompt: '実務で使用経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'Adobe Premiere Pro （カット編集、テロップ入れ、整音など標準的な編集）' },
      {
        id: 2,
        label: 'Adobe After Effects （モーショングラフィックス、VFX、高度なアニメーション作成）',
      },
      { id: 3, label: 'Final Cut Pro （Mac環境での編集、カット、トランジション適用など）' },
      { id: 4, label: 'DaVinci Resolve （カラーグレーディング、色調補正、編集など）' },
      { id: 5, label: 'CapCut / VLLO など （スマホ・タブレット向けアプリでのショート動画作成）' },
    ],
  },
  {
    id: 6,
    title: '動画編集スキル',
    prompt: '自信を持って対応できるものを選択してください。',
    answers: [
      { id: 1, label: 'カット編集（ジェットカット、マルチカメラ編集など）' },
      { id: 2, label: 'テロップ・字幕の挿入（見やすいフォント選定、装飾、タイミング調整）' },
      { id: 3, label: 'BGM・効果音（SE）の選定・挿入および音量バランスの調整' },
      { id: 4, label: 'モーショングラフィックスの作成（動くロゴ、タイトルアニメーションなど）' },
      { id: 5, label: 'キーイング・合成処理（グリーンバック合成、マスク処理など）' },
      {
        id: 6,
        label: 'カラーコレクション・カラーグレーディング（Log撮影データの編集、LUT適用など）',
      },
      { id: 7, label: '音声のノイズ除去・整音（環境音の低減、聞き取りやすい音声への加工）' },
    ],
  },
  {
    id: 7,
    title: '動画制作の周辺スキル',
    prompt: '当てはまるものを選択してください。',
    answers: [
      {
        id: 1,
        label:
          'サムネイル画像の作成（PhotoshopやCanva等を使用し、クリック率を意識した画像が作れる）',
      },
      {
        id: 2,
        label:
          'エンコード・書き出し設定の知識（解像度、フレームレート、コーデック、ビットレートの理解）',
      },
      { id: 3, label: '動画の構成・台本作成（構成案の作成や、絵コンテの作成が可能）' },
      { id: 4, label: '撮影機材の基本操作（一眼レフ、照明、マイク等のセッティングと撮影）' },
      {
        id: 5,
        label: '著作権・肖像権に関する基礎知識（BGMや素材サイトの利用規約理解、権利侵害の防止）',
      },
    ],
  },
  {
    id: 8,
    title: '動画ジャンル',
    prompt: 'これまでに制作・編集経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'YouTube動画（エンタメ、ビジネス系、Vlogなど）' },
      { id: 2, label: 'ショート動画（TikTok、Instagram Reels、YouTube Shorts）' },
      { id: 3, label: '企業プロモーション・商品紹介動画' },
      { id: 4, label: 'インタビュー・対談動画' },
      { id: 5, label: 'イベント・ウェディングムービー' },
      { id: 6, label: 'ゲーム実況動画' },
    ],
  },
]
