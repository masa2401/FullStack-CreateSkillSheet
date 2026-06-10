package com.skillsheet.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skillsheet.dto.AnswerDto;
import com.skillsheet.dto.CategoryDto;
import com.skillsheet.dto.QuestionDto;
import com.skillsheet.dto.request.SaveSheetRequest;
import com.skillsheet.entity.SheetAnswer;
import com.skillsheet.entity.SheetCategory;
import com.skillsheet.entity.SkillSheet;
import com.skillsheet.repository.SkillSheetRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SkillSheetService {

    private final SkillSheetRepository sheetRepository;

    /** スキルシートを保存してIDを返す */
    public UUID save(SaveSheetRequest req) {
        // 1. SkillSheetエンティティを作る
        SkillSheet sheet = new SkillSheet();
        sheet.setUserName(req.userName());
        sheet.setShareToken(UUID.randomUUID().toString()); // 共有トークン生成

        // 2. カテゴリをエンティティに変換して追加
        for (CategoryDto catDto : req.categories()) {
            SheetCategory category = new SheetCategory();
            category.setCategoryId(catDto.id());
            category.setGenre(catDto.genre());
            category.setIcon(catDto.icon());
            category.setSkillSheet(sheet); // 親への参照をセット

            // 3. 回答をエンティティに変換して追加
            for (QuestionDto qDto : catDto.questions()) {
                for (AnswerDto aDto : qDto.answers()) {
                    SheetAnswer answer = new SheetAnswer();
                    answer.setQuestionId(qDto.id());
                    answer.setQuestionText(qDto.questionText());
                    answer.setLabel(aDto.label());
                    answer.setValue(aDto.value());
                    answer.setSheetCategory(category);
                    category.getAnswers().add(answer);
                }
            }
            sheet.getCategories().add(category);
        }
        // 4. 保存（CascadeType.ALL により子も自動で保存される）
        return sheetRepository.save(sheet).getId();
    }

    /** IDでスキルシートを取得する */
    @Transactional(readOnly = true)
    public SaveSheetRequest findById(UUID id) {
        SkillSheet sheet = sheetRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("スキルシートが見つかりません"));

        // エンティティ → DTOに変換して返す（逆方向の変換）
        List<CategoryDto> categories = sheet.getCategories().stream()
                .map(cat -> new CategoryDto(
                        cat.getCategoryId(),
                        cat.getGenre(),
                        cat.getIcon(),
                        buildQustions(cat.getAnswers())))
                .toList();

        return new SaveSheetRequest(sheet.getUserName(), categories);
    }

    // 回答リストから質問DTO一覧を組み立てるヘルパー
    private List<QuestionDto> buildQustions(List<SheetAnswer> answers) {
        return answers.stream()
                .collect(Collectors.groupingBy(a -> a.getQuestionId()))
                .entrySet().stream()
                .map(entry -> {
                    SheetAnswer first = entry.getValue().get(0);
                    List<AnswerDto> answerDtos = entry.getValue().stream()
                            .map(a -> new AnswerDto(a.getLabel(), a.getValue()))
                            .toList();
                    return new QuestionDto(entry.getKey(), first.getQuestionText(), answerDtos);
                })
                .toList();
    }
}
