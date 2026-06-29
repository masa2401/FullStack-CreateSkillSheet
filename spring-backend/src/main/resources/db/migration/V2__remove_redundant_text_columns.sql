-- sheet_answers から不要なカラムを削除し、answer_id カラムを追加
alter table sheet_answers
    add column answer_id integer;

alter table sheet_answers
    drop column if exists question_text;

alter table sheet_answers
    drop column if exists label;

-- sheet_categories から不要なカラムを削除
alter table sheet_categories
    drop column if exists genre;