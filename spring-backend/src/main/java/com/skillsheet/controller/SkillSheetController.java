package com.skillsheet.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skillsheet.dto.request.SaveSheetRequest;
import com.skillsheet.dto.response.SaveSheetResponse;
import com.skillsheet.service.SkillSheetService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/sheets")
@RequiredArgsConstructor
public class SkillSheetController {
    private final SkillSheetService service;

    // POST /api/sheets → 保存
    @PostMapping
    public ResponseEntity<SaveSheetResponse> save(@RequestBody @Valid SaveSheetRequest req) {
        UUID id = service.save(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(new SaveSheetResponse(id));
    }

    // GET /api/sheets/{id} → 取得
    @GetMapping("/{id}")
    public ResponseEntity<SaveSheetRequest> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

}
