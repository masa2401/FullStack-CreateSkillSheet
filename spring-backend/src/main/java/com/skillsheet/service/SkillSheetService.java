package com.skillsheet.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skillsheet.dto.AnswerDto;
import com.skillsheet.dto.CategoryDto;
import com.skillsheet.dto.QuestionDto;
import com.skillsheet.dto.request.SaveSheetRequest;
import com.skillsheet.dto.response.SheetResponse;
import com.skillsheet.entity.SheetAnswer;
import com.skillsheet.entity.SheetCategory;
import com.skillsheet.entity.SkillSheet;
import com.skillsheet.exception.SheetExpiredException;
import com.skillsheet.repository.SkillSheetRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SkillSheetService {

    private final SkillSheetRepository sheetRepository;
    private final LambdaPdfService lambdaPdfService;

    @Value("${sheet.expiry.days:5}")
    private long expiryDays;

    /** スキルシートを保存してIDを返す */
    public UUID save(SaveSheetRequest req) {
        // 1. SkillSheetエンティティを作る
        SkillSheet sheet = new SkillSheet();
        sheet.setUserName(req.userName());
        sheet.setShareToken(UUID.randomUUID().toString()); // 共有トークン生成
        sheet.setExpiresAt(LocalDateTime.now().plusDays(expiryDays));

        // 2. カテゴリをエンティティに変換して追加
        for (CategoryDto catDto : req.categories()) {
            SheetCategory category = new SheetCategory();
            category.setCategoryId(catDto.categoryId());
            category.setSkillSheet(sheet); // 親への参照をセット

            // 3. 回答をエンティティに変換して追加
            for (QuestionDto qDto : catDto.questions()) {
                for (AnswerDto aDto : qDto.answers()) {
                    SheetAnswer answer = new SheetAnswer();
                    answer.setQuestionId(qDto.questionId());
                    answer.setAnswerId(aDto.answerId());
                    answer.setValue(aDto.value());
                    answer.setSheetCategory(category);
                    category.getAnswers().add(answer);
                }
            }

            sheet.getCategories().add(category);
        }

        UUID savedId = sheetRepository.save(sheet).getId();

        // 保存成功後にPDF生成を非同期リクエスト（失敗してもsave()自体は成功扱い）
        lambdaPdfService.requestGenerationAsync(savedId, req.userName());

        return savedId;
    }

    @Scheduled(cron = "${sheet.cleanup.cron:0 0 3 * * *}")
    public void deleteExpiredSheets() {
        List<SkillSheet> expiredSheets = sheetRepository.findByExpiresAtBefore(LocalDateTime.now());
        if (!expiredSheets.isEmpty()) {
            log.info("期限切れスキルシートを{}件削除します", expiredSheets.size());
            sheetRepository.deleteAll(expiredSheets);
        }
    }

    /** IDでスキルシートを取得する */
    @Transactional(readOnly = true)
    public SheetResponse findById(UUID id) {
        SkillSheet sheet = findActiveSheet(id);

        // エンティティ → DTOに変換して返す（逆方向の変換）
        List<CategoryDto> categories = sheet.getCategories().stream()
                .map(cat -> new CategoryDto(cat.getCategoryId(), buildQuestions(cat.getAnswers()))).toList();

        return new SheetResponse(sheet.getUserName(), categories);
    }

    /**
     * IDでシートの名前だけを取得する（PDF再生成用）。
     * 回答（categories）は遅延ロードのため読み込まれず、findById より軽い。
     */
    @Transactional(readOnly = true)
    public String findUserNameById(UUID id) {
        return findActiveSheet(id).getUserName();
    }

    // 未存在・期限切れのシートは例外にする（GlobalExceptionHandlerが404・410に変換する）
    private SkillSheet findActiveSheet(UUID id) {
        SkillSheet sheet = sheetRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("スキルシートが見つかりません"));

        if (sheet.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new SheetExpiredException("この共有リンクの有効期限は切れています", expiryDays);
        }
        return sheet;
    }

    // 回答リストから質問DTO一覧を組み立てるヘルパー
    private List<QuestionDto> buildQuestions(List<SheetAnswer> answers) {
        return answers.stream().collect(Collectors.groupingBy(a -> a.getQuestionId())).entrySet().stream()
                .map(entry -> {
                    List<AnswerDto> answerDtos = entry.getValue().stream()
                            .map(a -> new AnswerDto(a.getAnswerId(), a.getValue())).toList();
                    return new QuestionDto(entry.getKey(), answerDtos);
                }).toList();
    }
}
