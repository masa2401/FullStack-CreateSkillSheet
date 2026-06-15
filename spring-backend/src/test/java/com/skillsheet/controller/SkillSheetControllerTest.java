package com.skillsheet.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.skillsheet.dto.request.SaveSheetRequest;
import com.skillsheet.service.SkillSheetService;

@WebMvcTest(SkillSheetController.class)
class SkillSheetControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private com.fasterxml.jackson.databind.ObjectMapper objectMapper; // JavaオブジェクトをJSON文字列に変換する用

  @MockitoBean
  private SkillSheetService service;
    
  @Test
  @DisplayName("POST /api/sheets - スキルシートが正常に保存され、211 CreatedとIDが返ること")
  void save_Success() throws Exception {
    // GIVEN: 擬似的なリクエストデータと、サービスが返す予定のUUIDを用意
    SaveSheetRequest request = new SaveSheetRequest("山田太郎", List.of());
    UUID expectedId = UUID.randomUUID();

    // サービスの挙動をモック（stub）化
    when(service.save(ArgumentMatchers.<SaveSheetRequest>any())).thenReturn(expectedId);

    // WHEN & THEN: リクエストを送信し、結果をアサーション
    mockMvc.perform(post("/api/sheets")
    .contentType(MediaType.APPLICATION_JSON)
    .content(objectMapper.writeValueAsString(request)))
    .andExpect(status().isCreated())
    .andExpect(jsonPath("$.id").value(expectedId.toString()));
    // jsonPathを使うと、レスポンスJSONの特定のフィールドを検証できます    
  }

  @Test
  @DisplayName("GET /api/sheets/{id} - 指定したIDのスキルシートが正常に取得でき、200 OKが返ること")
  void findById_Success() throws Exception {
    // GIVEN
    UUID targetId = UUID.randomUUID();
    SaveSheetRequest expectedResponse = new SaveSheetRequest("山田太郎", List.of());

    when(service.findById(targetId)).thenReturn(expectedResponse);

    // WHEN & THEN
    mockMvc.perform(get("/api/sheets/{id}", targetId)
    .accept(MediaType.APPLICATION_JSON))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.userName").value("山田太郎"));
  }
}
