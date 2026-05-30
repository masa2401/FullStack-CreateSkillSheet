package com.example.skillsheet.service;

import java.util.UUID;
import org.springframework.stereotype.Service;

import com.example.skillsheet.dto.AnswerDto;
import com.example.skillsheet.dto.CategoryDto;
import com.example.skillsheet.dto.QuestionDto;
import com.example.skillsheet.dto.request.SaveSheetRequest;
import com.example.skillsheet.entity.SheetAnswer;
import com.example.skillsheet.entity.SheetCategory;
import com.example.skillsheet.entity.SkillSheet;
import com.example.skillsheet.repository.SkillSheetRepository;
import jakarta.transaction.Transactional;
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
}
