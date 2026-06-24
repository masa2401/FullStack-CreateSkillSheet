-- 1. テーブルの作成
create table sheet_answers (
    id bigint not null,
    "label" varchar(255),
    question_id integer,
    question_text varchar(255),
    "value" integer,
    category_id bigint not null,
    primary key (id)
);

create table sheet_categories (
    id bigint not null,
    category_id integer,
    genre varchar(255),
    sheet_id uuid not null,
    primary key (id)
);

create table skill_sheets (
    id uuid not null,
    created_at timestamp(6),
    expires_at timestamp(6) not null,
    share_token varchar(255),
    user_name varchar(255) not null,
    primary key (id)
);

-- 2. ユニーク制約の追加（重複防止）
alter table if exists skill_sheets
    drop constraint if exists uk_skill_sheets_share_token;

alter table if exists skill_sheets
    add constraint uk_skill_sheets_share_token unique (share_token);

-- 3. ID自動採番用のシーケンス作成
create sequence sheet_answers_id_seq start with 1 increment by 1;

create sequence sheet_categories_id_seq start with 1 increment by 1;

-- 4. 外部キー制約の追加（テーブル間の紐付け）
alter table if exists sheet_answers
    add constraint fk_sheet_answers_sheet_categories
    foreign key (category_id)
    references sheet_categories;

alter table if exists sheet_categories
    add constraint fk_sheet_categories_skill_sheets
    foreign key (sheet_id)
    references skill_sheets;