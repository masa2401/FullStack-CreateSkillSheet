-- sheet_answers の外部キー列を改名する。sheet_categories.category_id（マスタのカテゴリ ID）と同名で紛らわしいため
alter table sheet_answers
    rename column category_id to sheet_category_id;

-- PostgreSQL は外部キー列にインデックスを自動で作らないため、シートの取得と削除で使う列に追加する
create index idx_sheet_categories_sheet_id on sheet_categories (sheet_id);

create index idx_sheet_answers_sheet_category_id on sheet_answers (sheet_category_id);

-- 期限切れシートの定期削除（expires_at と現在時刻の比較）で使う
create index idx_skill_sheets_expires_at on skill_sheets (expires_at);