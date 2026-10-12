package com.skillsheet.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.sql.DataSource;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.skillsheet.TestcontainersConfiguration;
import com.skillsheet.dto.AnswerDto;
import com.skillsheet.dto.CategoryDto;
import com.skillsheet.dto.QuestionDto;
import com.skillsheet.dto.request.SaveSheetRequest;
import com.skillsheet.dto.response.SheetResponse;

import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

/**
 * 実際の PostgreSQL（Testcontainers）を使い、トランザクションと DB に依存する挙動を確かめる。
 * 単体テストではモックに置き換わるため確かめられない、コミットの順序と JOIN の結果が対象
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class SkillSheetServiceIntegrationTest {

  private static final Pattern PAYLOAD_ID = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-f-]{36})\"");

  @MockitoBean
  private LambdaClient lambdaClient;

  @Autowired
  private SkillSheetService service;

  @Autowired
  private DataSource dataSource;

  @Test
  @DisplayName("保存のコミット後に Lambda を Invoke し、その時点で別の接続からシートを読めること")
  void save_InvokesLambdaAfterCommit() {
    // GIVEN: Invoke の時点で、別の接続からシートが見えるかを記録する。
    // requestGenerationAsync は例外を握りつぶすため、ここでは判定せず結果だけを残す
    AtomicReference<Boolean> visibleAtInvoke = new AtomicReference<>();
    when(lambdaClient.invoke(any(InvokeRequest.class))).thenAnswer(invocation -> {
      InvokeRequest request = invocation.getArgument(0);
      visibleAtInvoke.set(existsFromAnotherConnection(sheetIdOf(request)));
      return InvokeResponse.builder().statusCode(202).build();
    });

    // WHEN
    service.save(new SaveSheetRequest("山田太郎", List.of()));

    // THEN: Invoke されていること（@Transactional が外れるとイベントが捨てられ、呼ばれなくなる）と、
    // その時点でコミット済みであること（コミット前に呼ぶと別の接続からは見えない）
    verify(lambdaClient).invoke(any(InvokeRequest.class));
    assertThat(visibleAtInvoke.get()).isTrue();
  }

  @Test
  @DisplayName("保存したシートを取得すると、回答の無いカテゴリも含めてカテゴリと回答がそろって返ること")
  void findById_ReturnsCategoriesWithAnswers() {
    // GIVEN: 回答を2件持つカテゴリと、回答の無いカテゴリ（チェックだけ付いた状態）
    when(lambdaClient.invoke(any(InvokeRequest.class))).thenReturn(InvokeResponse.builder().statusCode(202).build());
    UUID id = service.save(new SaveSheetRequest("山田太郎", List.of(
        new CategoryDto(1, List.of(new QuestionDto(1, List.of(new AnswerDto(10, 3), new AnswerDto(11, 4))))),
        new CategoryDto(2, List.of()))));

    // WHEN
    SheetResponse response = service.findById(id);

    // THEN
    assertThat(response.userName()).isEqualTo("山田太郎");
    assertThat(response.categories()).containsExactlyInAnyOrder(
        new CategoryDto(1, List.of(new QuestionDto(1, List.of(new AnswerDto(10, 3), new AnswerDto(11, 4))))),
        new CategoryDto(2, List.of()));
  }

  private UUID sheetIdOf(InvokeRequest request) {
    Matcher matcher = PAYLOAD_ID.matcher(request.payload().asUtf8String());
    if (!matcher.find()) {
      throw new IllegalStateException("Invoke のペイロードに id がありません");
    }
    return UUID.fromString(matcher.group(1));
  }

  // DataSource から直接取得した接続は、保存中のトランザクションとは別の接続になる
  private boolean existsFromAnotherConnection(UUID id) throws SQLException {
    try (Connection connection = dataSource.getConnection();
        PreparedStatement statement = connection.prepareStatement(
            "select count(*) from skill_sheets where id = ?")) {
      statement.setObject(1, id);
      try (ResultSet resultSet = statement.executeQuery()) {
        resultSet.next();
        return resultSet.getInt(1) == 1;
      }
    }
  }
}