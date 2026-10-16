package com.example.quanly_giaocu.controller;

import com.example.quanly_giaocu.dto.request.*;
import com.example.quanly_giaocu.dto.response.BudgetCheckResponse;
import com.example.quanly_giaocu.dto.response.ProposalResponse;
import com.example.quanly_giaocu.enums.Priority;
import com.example.quanly_giaocu.enums.ProposalStatus;
import com.example.quanly_giaocu.service.ProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/proposals")
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;

    // API Tạo đề xuất mới
    @PostMapping
    public ApiResponse<ProposalResponse> createProposal(@Valid @RequestBody ProposalCreateRequest request) {
        return ApiResponse.<ProposalResponse>builder()
                .result(proposalService.createProposal(request))
                .message("Tạo đề xuất thành công")
                .build();
    }

    @GetMapping("/next-code")
    public ApiResponse<String> getNextProposalCode() {
        return ApiResponse.<String>builder()
                .result(proposalService.getNextProposalCode())
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ProposalResponse> updateProposal(
            @PathVariable Long id,
            @Valid @RequestBody ProposalUpdateRequest request) {

        return ApiResponse.<ProposalResponse>builder()
                .result(proposalService.updateProposal(id, request))
                .message("Cập nhật đề xuất thành công")
                .build();
    }

    // API Lấy danh sách đề xuất của tôi (Dành cho Giáo viên)
    @GetMapping("/my-proposals")
    public ApiResponse<List<ProposalResponse>> getMyProposals(
            @RequestParam(required = false) ProposalStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String code) {

        return ApiResponse.<List<ProposalResponse>>builder()
                .result(proposalService.getMyProposals(status, startDate, endDate, code))
                .message("Lấy danh sách đề xuất thành công")
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<ProposalResponse> getProposalById(@PathVariable Long id) {
        return ApiResponse.<ProposalResponse>builder()
                .result(proposalService.getProposalById(id))
                .build();
    }

    @PostMapping("/{id}/approve-manager")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<String> approveByManager(@PathVariable Long id, @RequestBody(required = false) ActionRequest request) {
        proposalService.approveByManager(id, request != null ? request.getNote() : null);
        return ApiResponse.<String>builder().result("Đã duyệt đề xuất").build();
    }

    // CHỈ CHO MANAGER YÊU CẦU CHỈNH SỬA
    @PostMapping("/{id}/request-revision")
    @PreAuthorize("hasAnyRole('MANAGER', 'DIRECTOR')")
    public ApiResponse<String> requestRevision(@PathVariable Long id, @Valid @RequestBody ActionRequest request) {
        proposalService.requestRevision(id, request.getNote());
        return ApiResponse.<String>builder().result("Đã yêu cầu chỉnh sửa").build();
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER')")
    public ApiResponse<String> rejectProposal(@PathVariable Long id, @Valid @RequestBody ActionRequest request) {
        proposalService.rejectProposal(id, request.getNote());
        return ApiResponse.<String>builder().result("Đã từ chối").build();
    }

    @GetMapping("/pending-manager")
    @PreAuthorize("hasAnyRole('MANAGER', 'DIRECTOR')")
    public ApiResponse<Page<ProposalResponse>> getPendingManagerProposals(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Double minCost,
            @RequestParam(required = false) Double maxCost,
            @RequestParam(required = false) UUID groupId,
            @RequestParam(required = false) UUID creatorId,
            Pageable pageable) { // Cho phép truyền page, size, sort từ FE

        return ApiResponse.<Page<ProposalResponse>>builder()
                .result(proposalService.getPendingManagerProposals(
                        startDate, endDate, priority, minCost, maxCost, groupId, creatorId, pageable))
                .build();
    }

    // =====================================
    // KẾ TOÁN (ACCOUNTANT) API
    // =====================================

    // 1. Xem danh sách chờ duyệt ngân sách
    @GetMapping("/pending-accountant")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'DIRECTOR')")
    public ApiResponse<Page<ProposalResponse>> getPendingAccountantProposals(
            // ... copy các RequestParam y hệt getPendingManagerProposals
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Double minCost,
            @RequestParam(required = false) Double maxCost,
            @RequestParam(required = false) UUID groupId,
            @RequestParam(required = false) UUID creatorId,
            Pageable pageable) {
        return ApiResponse.<Page<ProposalResponse>>builder()
                .result(proposalService.getPendingAccountantProposals(startDate, endDate, priority, minCost, maxCost, groupId, creatorId, pageable))
                .build();
    }

    // 2. Kế toán xem Báo cáo đối soát ngân sách của 1 đề xuất
    @GetMapping("/{id}/budget-check")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'DIRECTOR')")
    public ApiResponse<BudgetCheckResponse> checkProposalBudget(@PathVariable Long id) {
        return ApiResponse.<BudgetCheckResponse>builder()
                .result(proposalService.checkProposalBudget(id))
                .build();
    }

    // 3. Kế toán Đồng ý duyệt
    @PostMapping("/{id}/approve-accountant")
    @PreAuthorize("hasRole('ACCOUNTANT')")
    public ApiResponse<String> approveByAccountant(@PathVariable Long id, @RequestBody(required = false) ActionRequest request) {
        proposalService.approveByAccountant(id, request != null ? request.getNote() : null);
        return ApiResponse.<String>builder().result("Đã chuyển Giám đốc Trung tâm duyệt chi").build();
    }

    // 4. Kế toán Từ chối đề xuất
    @PostMapping("/{id}/reject-accountant")
    public ApiResponse<String> rejectByAccountant(@PathVariable Long id, @Valid @RequestBody ActionRequest request) {
        proposalService.rejectByAccountant(id, request.getNote());
        return ApiResponse.<String>builder().result("Đã từ chối đề xuất do vấn đề ngân sách").build();
    }

    // =====================================
    // GIÁM ĐỐC (DIRECTOR) API
    // =====================================

    @GetMapping("/pending-director")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ApiResponse<Page<ProposalResponse>> getPendingDirectorProposals(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) UUID groupId,
            Pageable pageable) {
        return ApiResponse.<Page<ProposalResponse>>builder()
                .result(proposalService.getPendingDirectorProposals(startDate, endDate, priority, groupId, pageable))
                .build();
    }

    @PostMapping("/{id}/approve-director")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ApiResponse<String> approveByDirector(@PathVariable Long id, @RequestBody(required = false) ActionRequest request) {
        proposalService.approveByDirector(id, request != null ? request.getNote() : null);
        return ApiResponse.<String>builder().result("Đã phê duyệt chi thành công").build();
    }

    @PostMapping("/{id}/reject-director")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ApiResponse<String> rejectByDirector(@PathVariable Long id, @Valid @RequestBody ActionRequest request) {
        proposalService.rejectByDirector(id, request.getNote());
        return ApiResponse.<String>builder().result("Đã từ chối đề xuất").build();
    }

    // =====================================
    // HÀNH CHÍNH (ADMINISTRATIVE_STAFF) API
    // =====================================

    @GetMapping("/approved-proposals")
    @PreAuthorize("hasRole('ADMINISTRATIVE_STAFF')")
    public ApiResponse<Page<ProposalResponse>> getApprovedProposals(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) UUID creatorId,
            Pageable pageable) {
        return ApiResponse.<Page<ProposalResponse>>builder()
                .result(proposalService.getApprovedProposals(startDate, endDate, priority, creatorId, pageable))
                .build();
    }

    @PostMapping("/{id}/confirm-purchase")
    @PreAuthorize("hasRole('ADMINISTRATIVE_STAFF')")
    public ApiResponse<String> confirmPurchase(@PathVariable Long id, @Valid @RequestBody PurchaseConfirmationRequest request) {
        proposalService.confirmPurchase(id, request);
        return ApiResponse.<String>builder().result("Đã xác nhận lưu thông tin mua hàng thành công").build();
    }

}