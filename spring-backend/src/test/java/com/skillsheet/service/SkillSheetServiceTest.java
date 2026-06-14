package com.skillsheet.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.skillsheet.dto.AnswerDto;
import com.skillsheet.dto.CategoryDto;
import com.skillsheet.dto.QuestionDto;
import com.skillsheet.dto.request.SaveSheetRequest;
import com.skillsheet.entity.SkillSheet;
import com.skillsheet.repository.SkillSheetRepository;

@ExtendWith(MockitoExtension.class)
class SkillSheetServiceTest {

  @Mock
  private SkillSheetRepository sheetRepository;

  @InjectMocks
  private SkillSheetService service; 

  @Test
  @DisplayName("save: リクエストが正常にエンティティに変換され、保存されてIDが返ること")
  void save_Success() {
    // GIVEN: 階層構造を持ったテストデータを作成
    AnswerDto answerDto = new AnswerDto("回答A", 3);
    QuestionDto questionDto = new QuestionDto(1 , "Q1 テスト質問", List.of(answerDto));
    CategoryDto categoryDto = new CategoryDto(2, "テスト", List.of(questionDto));
    SaveSheetRequest request = new SaveSheetRequest("山田太郎", List.of(categoryDto));

    // 保存後にリポジトリが返すダミーのエンティティ（ID付き）を用意
    UUID expectedId = UUID.randomUUID();
    SkillSheet savedSheet = new SkillSheet();
    savedSheet.setId(expectedId);

    when(sheetRepository.save(ArgumentMatchers.<SkillSheet>any())).thenReturn(savedSheet);

    // WHEN: テスト対象メソッドの実行
    UUID acutualId = service.save(request);
    // THEN: アサーション（AssertJのassertThatを使用）
    assertThat(acutualId);

    // リポジトリのsaveメソッドが本当に呼ばれたかどうかの検証
    verify(sheetRepository).save(ArgumentMatchers.<SkillSheet>any());
  }

  @Test
  @DisplayName("findById: 該当するスキルシートが存在しない場合、NoSuchElementExceptionがスローされること")
  void findById_NotFound_ThrowsException() {
    // GIVEN: リポジトリが空（Optional.empty()）を返すように設定
    UUID targetId = UUID.randomUUID();
    when(sheetRepository.findById(targetId)).thenReturn(Optional.empty());

    // WHEN & THEN: 例外が発生することを検証
    assertThatThrownBy(() -> service.findById(targetId)).isInstanceOf(NoSuchElementException.class).hasMessageContaining("スキルシートが見つかりません");
  }  
}
