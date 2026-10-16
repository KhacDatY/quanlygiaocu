package com.example.quanly_giaocu.controller;

import com.example.quanly_giaocu.dto.request.ApiResponse;
import com.example.quanly_giaocu.dto.request.FundAllocationRequest;
import com.example.quanly_giaocu.dto.request.GroupCreationRequest;
import com.example.quanly_giaocu.dto.request.GroupUpdateRequest;
import com.example.quanly_giaocu.dto.response.GroupResponse;
import com.example.quanly_giaocu.service.GroupService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GroupController {
    GroupService groupService;

    @PostMapping
    public ApiResponse<GroupResponse> createGroup(@Valid @RequestBody GroupCreationRequest request) {
        return ApiResponse.<GroupResponse>builder()
                .result(groupService.createGroup(request))
                .build();
    }


    @GetMapping
    public ApiResponse<List<GroupResponse>> getAllGroups() {
        return ApiResponse.<List<GroupResponse>>builder()
                .result(groupService.getAllGroups())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<GroupResponse> getGroup(@PathVariable UUID id) {
        return ApiResponse.<GroupResponse>builder()
                .result(groupService.getGroup(id))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<GroupResponse> updateGroup(@PathVariable UUID id, @Valid @RequestBody GroupUpdateRequest request) {
        return ApiResponse.<GroupResponse>builder()
                .result(groupService.updateGroup(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteGroup(@PathVariable UUID id) {
        groupService.deleteGroup(id);
        return ApiResponse.<String>builder()
                .result("Đã xóa nhóm thành công")
                .build();
    }

    // API CẤP PHÁT TÀI CHÍNH
    @PutMapping("/{id}/allocate-fund")
    public ApiResponse<GroupResponse> allocateFund(
            @PathVariable UUID id,
            @Valid @RequestBody FundAllocationRequest request) {
        return ApiResponse.<GroupResponse>builder()
                .result(groupService.allocateFund(id, request))
                .build();
    }
}