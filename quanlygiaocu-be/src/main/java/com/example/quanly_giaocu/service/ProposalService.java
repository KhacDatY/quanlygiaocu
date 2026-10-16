package com.example.quanly_giaocu.service;

import com.example.quanly_giaocu.dto.request.*;
import com.example.quanly_giaocu.dto.response.BudgetCheckResponse;
import com.example.quanly_giaocu.dto.response.ProposalResponse;
import com.example.quanly_giaocu.entity.*;
import com.example.quanly_giaocu.enums.AttachmentType;
import com.example.quanly_giaocu.enums.Priority;
import com.example.quanly_giaocu.enums.ProposalAction;
import com.example.quanly_giaocu.enums.ProposalStatus;
import com.example.quanly_giaocu.exception.AppException;
import com.example.quanly_giaocu.exception.ErrorCode;
import com.example.quanly_giaocu.mapper.ProposalMapper;
import com.example.quanly_giaocu.repository.BudgetRepository;
import com.example.quanly_giaocu.repository.ProposalRepository;
import com.example.quanly_giaocu.repository.UserRepository;
import com.example.quanly_giaocu.specification.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProposalService {

    private final ProposalRepository proposalRepository;
    private final UserRepository userRepository;
    private final ProposalMapper proposalMapper;
    private final BudgetRepository budgetRepository;

    @Transactional
    public ProposalResponse createProposal(ProposalCreateRequest request) {
        // 1. Lấy user đang đăng nhập từ Context
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 2. Khởi tạo Đề xuất
        Proposal proposal = new Proposal();
        proposal.setCreator(creator);
        proposal.setPurpose(request.getPurpose());
        proposal.setRequiredDate(request.getRequiredDate());
        proposal.setPriority(request.getPriority());
        proposal.setStatus(ProposalStatus.PENDING_MANAGER);

        proposal.setCode(getNextProposalCode());

        // 3. Xử lý Giáo cụ
        Double estimatedTotal = 0.0;
        if (request.getItems() != null) {
            List<ProposalItem> items = new ArrayList<>();
            for (ProposalItemRequest itemReq : request.getItems()) {
                ProposalItem item = new ProposalItem();
                item.setName(itemReq.getName());
                item.setCategory(itemReq.getCategory());
                item.setQuantity(itemReq.getQuantity());
                item.setUnit(itemReq.getUnit());
                item.setPrice(itemReq.getPrice());

                // Cộng dồn tổng tiền
                estimatedTotal += (item.getPrice() * item.getQuantity());

                // Xử lý quan hệ 2 chiều trực tiếp tại Service
                item.setProposal(proposal);
                items.add(item);
            }
            proposal.setItems(items);
        }
        proposal.setEstimatedTotal(estimatedTotal);

        // 4. Xử lý File đính kèm
        if (request.getAttachments() != null) {
            List<ProposalAttachment> attachments = new ArrayList<>(); // Tạo mới List
            for (AttachmentRequest attReq : request.getAttachments()) {
                ProposalAttachment attachment = new ProposalAttachment();
                attachment.setFileName(attReq.getFileName());
                attachment.setFileUrl(attReq.getFileUrl());
                attachment.setFileType(attReq.getFileType());
                attachment.setType(AttachmentType.PROPOSAL_DOC); // Đánh dấu là file của Giáo viên

                attachment.setProposal(proposal);
                attachments.add(attachment);
            }
            // Gán toàn bộ List vào Proposal
            proposal.setAttachments(attachments);
        }

        // 1. Tạo log: Người dùng tạo đề xuất
        ProposalHistory createHistory = new ProposalHistory();
        createHistory.setProposal(proposal);
        createHistory.setActor(creator); // Gắn User là Trần Thu Hà
        createHistory.setAction(ProposalAction.CREATED);
        createHistory.setNote("Khởi tạo đề xuất mua sắm giáo cụ cho cơ sở.");
        createHistory.setCreatedAt(LocalDateTime.now());

        // 2. Tạo log: Hệ thống tự động chuyển tiếp
        ProposalHistory forwardHistory = new ProposalHistory();
        forwardHistory.setProposal(proposal);
        forwardHistory.setActor(null); // Hệ thống thực hiện nên actor = null
        forwardHistory.setAction(ProposalAction.SYSTEM_FORWARD);
        forwardHistory.setNote("Hồ sơ đề xuất đã chuyển đến Quản lý học vụ để xem xét.");
        forwardHistory.setCreatedAt(LocalDateTime.now().plusSeconds(1));

        List<ProposalHistory> histories = new ArrayList<>();
        histories.add(createHistory);
        histories.add(forwardHistory);
        proposal.setHistories(histories);

        // 5. Lưu vào DB và map sang Response
        Proposal savedProposal = proposalRepository.save(proposal);
        return proposalMapper.toProposalResponse(savedProposal);
    }

    public String getNextProposalCode() {
        int year = LocalDate.now().getYear();
        String prefix = "DX-" + year + "-";
        Optional<Proposal> lastProposal = proposalRepository.findFirstByCodeStartingWithOrderByCodeDesc(prefix);

        if (lastProposal.isPresent()) {
            String lastCode = lastProposal.get().getCode();
            try {
                // Cắt lấy 4 số cuối: DX-2026-0001 -> 0001
                int sequence = Integer.parseInt(lastCode.substring(lastCode.lastIndexOf("-") + 1));
                return prefix + String.format("%04d", sequence + 1);
            } catch (NumberFormatException e) {
                return prefix + "0001";
            }
        }
        return prefix + "0001";
    }

    public ProposalResponse getProposalById(Long id) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROPOSAL_NOT_FOUND));

        ProposalResponse response = proposalMapper.toProposalResponse(proposal);

        // Map History thủ công (hoặc bạn có thể tạo HistoryMapper riêng nếu muốn)
        if (proposal.getHistories() != null) {
            List<com.example.quanly_giaocu.dto.response.ProposalHistoryResponse> historyResponses = proposal.getHistories().stream().map(h ->
                    com.example.quanly_giaocu.dto.response.ProposalHistoryResponse.builder()
                            .id(h.getId())
                            .actionLabel(h.getAction().getDescription())
                            .actorName(h.getActor() != null ? h.getActor().getFullName() : "Hệ thống")
                            .actorRole(h.getActor() != null && h.getActor().getRole() != null ? h.getActor().getRole().name() : null)
                            .note(h.getNote())
                            .createdAt(h.getCreatedAt())
                            .build()
            ).collect(java.util.stream.Collectors.toList());

            response.setHistories(historyResponses);
        }

        return response;
    }

    @Transactional
    public ProposalResponse updateProposal(Long id, ProposalUpdateRequest request) {
        // 1. Lấy thông tin User hiện tại
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 2. Tìm đề xuất trong Database
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROPOSAL_NOT_FOUND));

        // 3. Kiểm tra điều kiện: CHỈ CHO PHÉP SỬA KHI QUẢN LÝ CHƯA DUYỆT
        if (proposal.getStatus() != ProposalStatus.PENDING_MANAGER &&
                proposal.getStatus() != ProposalStatus.NEEDS_REVISION) {
            throw new AppException(ErrorCode.PROPOSAL_CANNOT_EDIT);
        }

        // 4. Cập nhật thông tin chung
        if (request.getPurpose() != null) proposal.setPurpose(request.getPurpose());
        if (request.getRequiredDate() != null) proposal.setRequiredDate(request.getRequiredDate());
        if (request.getPriority() != null) proposal.setPriority(request.getPriority());

        // 5. Cập nhật danh sách Giáo cụ (Xóa cũ, Thêm mới)
        proposal.getItems().clear(); // Xóa toàn bộ item cũ
        Double estimatedTotal = 0.0;

        if (request.getItems() != null) {
            for (ProposalItemRequest itemReq : request.getItems()) {
                ProposalItem item = new ProposalItem();
                item.setName(itemReq.getName());
                item.setCategory(itemReq.getCategory());
                item.setQuantity(itemReq.getQuantity());
                item.setUnit(itemReq.getUnit());
                item.setPrice(itemReq.getPrice());

                estimatedTotal += (item.getPrice() * item.getQuantity());

                item.setProposal(proposal);
                proposal.getItems().add(item);
            }
        }
        proposal.setEstimatedTotal(estimatedTotal);

        // 6. Cập nhật danh sách File đính kèm của Giáo viên (Xóa cũ, Thêm mới)
        if (request.getAttachments() != null) {
            // Chỉ xóa các file do Giáo viên up (PROPOSAL_DOC), giữ nguyên file của Hành chính (nếu có - dù ở trạng thái này chưa có)
            proposal.getAttachments().removeIf(att -> att.getType() == AttachmentType.PROPOSAL_DOC);

            for (AttachmentRequest attReq : request.getAttachments()) {
                ProposalAttachment attachment = new ProposalAttachment();
                attachment.setFileName(attReq.getFileName());
                attachment.setFileUrl(attReq.getFileUrl());
                attachment.setFileType(attReq.getFileType());
                attachment.setType(AttachmentType.PROPOSAL_DOC);

                attachment.setProposal(proposal);
                proposal.getAttachments().add(attachment);
            }
        }

        // 7. Chuyển lại trạng thái chờ Quản lý duyệt (Phục vụ case gửi lại sau khi bị yêu cầu sửa)
        proposal.setStatus(ProposalStatus.PENDING_MANAGER);

        // 8. GHI LOG LỊCH SỬ (HISTORY)
        ProposalHistory history = new ProposalHistory();
        history.setProposal(proposal);
        history.setActor(currentUser);
        history.setAction(ProposalAction.UPDATED); // Động từ: Đã cập nhật

        // Nếu giáo viên có nhập ghi chú giải trình thì lưu lại, không thì dùng câu mặc định
        String note = (request.getEditNote() != null && !request.getEditNote().isBlank())
                ? request.getEditNote()
                : "Người tạo đã cập nhật lại nội dung đề xuất.";
        history.setNote(note);
        history.setCreatedAt(LocalDateTime.now());

        proposal.getHistories().add(history); // Thêm dòng log vào đề xuất

        // 9. Lưu vào database và trả về kết quả
        Proposal savedProposal = proposalRepository.save(proposal);
        return proposalMapper.toProposalResponse(savedProposal);
    }

    public Page<ProposalResponse> getPendingManagerProposals(
            LocalDate startDate, LocalDate endDate, Priority priority,
            Double minCost, Double maxCost, UUID groupId, UUID creatorId,
            Pageable pageable) {

        Specification<Proposal> spec = ManagerProposalSpecification.filterPendingProposals(
                startDate, endDate, priority, minCost, maxCost, groupId, creatorId);

        return proposalRepository.findAll(spec, pageable)
                .map(proposalMapper::toProposalResponse);
    }

    // Xem danh sách đề xuất của tôi
    public List<ProposalResponse> getMyProposals(ProposalStatus status, LocalDate startDate, LocalDate endDate, String code) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Khởi tạo Specification với các tham số truyền vào
        Specification<Proposal> spec = ProposalSpecification.filterMyProposals(
                creator.getId(), status, startDate, endDate, code);

        // Tìm kiếm và sắp xếp theo ngày tạo mới nhất (giảm dần)
        List<Proposal> proposals = proposalRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));

        return proposals.stream()
                .map(proposalMapper::toProposalResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveByManager(Long proposalId, String note) {
        Proposal proposal = getProposalAndValidateStatus(proposalId, ProposalStatus.PENDING_MANAGER);

        proposal.setStatus(ProposalStatus.PENDING_ACCOUNTANT);
        saveHistoryLog(proposal, ProposalAction.APPROVED_NEEDS, note);

        proposalRepository.save(proposal);
    }

    // 3. YÊU CẦU CHỈNH SỬA
    @Transactional
    public void requestRevision(Long proposalId, String note) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đề xuất"));

        if (proposal.getStatus() != ProposalStatus.PENDING_MANAGER &&
                proposal.getStatus() != ProposalStatus.PENDING_DIRECTOR) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        proposal.setStatus(ProposalStatus.NEEDS_REVISION);
        saveHistoryLog(proposal, ProposalAction.REQUEST_REVISION, note);

        proposalRepository.save(proposal);
    }

    // 4. TỪ CHỐI ĐỀ XUẤT
    @Transactional
    public void rejectProposal(Long proposalId, String note) {
        Proposal proposal = getProposalAndValidateStatus(proposalId, ProposalStatus.PENDING_MANAGER);

        proposal.setStatus(ProposalStatus.REJECTED);
        saveHistoryLog(proposal, ProposalAction.REJECTED, note);

        proposalRepository.save(proposal);
    }

    // --- Các hàm Helper ---
    private Proposal getProposalAndValidateStatus(Long id, ProposalStatus expectedStatus) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROPOSAL_NOT_FOUND));
        if (proposal.getStatus() != expectedStatus) {
            throw new AppException(ErrorCode.INVALID_KEY); // Thêm lỗi Status không hợp lệ
        }
        return proposal;
    }

    private void saveHistoryLog(Proposal proposal, ProposalAction action, String note) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElse(null);

        ProposalHistory history = new ProposalHistory();
        history.setProposal(proposal);
        history.setActor(currentUser);
        history.setAction(action);
        history.setNote(note != null ? note : action.getDescription());
        history.setCreatedAt(LocalDateTime.now());

        proposal.getHistories().add(history);
    }

    public Page<ProposalResponse> getPendingAccountantProposals(
            LocalDate startDate, LocalDate endDate, Priority priority,
            Double minCost, Double maxCost, UUID groupId, UUID creatorId,
            Pageable pageable) {
        Specification<Proposal> spec = AccountantProposalSpecification.filterPendingProposals(
                startDate, endDate, priority, minCost, maxCost, groupId, creatorId); // Tạm dùng lại spec, đổi status bên trong spec nhé!

        return proposalRepository.findAll(spec, pageable)
                .map(proposalMapper::toProposalResponse);
    }

    // Tính toán đối soát ngân sách cho 1 đề xuất
    public BudgetCheckResponse checkProposalBudget(Long proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đề xuất"));

        // 1. Tính toán Quý và Năm từ Ngày tạo đề xuất
        LocalDateTime createdAt = proposal.getCreatedAt();
        int year = createdAt.getYear();
        int month = createdAt.getMonthValue();
        int quarter = (month - 1) / 3 + 1; // VD: Tháng 10,11,12 -> Quý 4

        // 2. Lấy Ngân sách của Quý đó
        Budget budget = budgetRepository.findByYearAndQuarter(year, quarter)
                .orElseThrow(() -> new RuntimeException("Chưa cấu hình ngân sách cho Quý " + quarter + "/" + year));

        // Xác định ngày bắt đầu và kết thúc của Quý để Query
        int startMonth = (quarter - 1) * 3 + 1;
        LocalDateTime startOfQuarter = LocalDateTime.of(year, startMonth, 1, 0, 0, 0);
        LocalDateTime endOfQuarter = startOfQuarter.plusMonths(3).minusNanos(1);

        // 3. Tính SPENT (Đã thực chi - trạng thái COMPLETED)
        Double spentAmount = proposalRepository.sumTotalByStatusAndDateRange(
                ProposalStatus.COMPLETED, startOfQuarter, endOfQuarter);

        // 4. Tính COMMITTED (Đã cam kết - trạng thái APPROVED do GĐ duyệt hoặc tự động duyệt)
        Double committedAmount = proposalRepository.sumTotalByStatusAndDateRange(
                ProposalStatus.APPROVED, startOfQuarter, endOfQuarter);

        // 5. Tính toán các chỉ số Khả dụng
        Double allocatedAmount = budget.getAllocatedAmount();
        Double availableBeforeApproval = allocatedAmount - spentAmount - committedAmount;
        Double proposalTotal = proposal.getEstimatedTotal();
        Double remainingIfApproved = availableBeforeApproval - proposalTotal;

        boolean isBudgetSufficient = remainingIfApproved >= 0;

        return BudgetCheckResponse.builder()
                .periodLabel("Quý " + quarter + "/" + year)
                .allocatedAmount(allocatedAmount)
                .spentAmount(spentAmount)
                .committedAmount(committedAmount)
                .availableBeforeApproval(availableBeforeApproval)
                .proposalEstimatedTotal(proposalTotal)
                .remainingIfApproved(remainingIfApproved)
                .isBudgetSufficient(isBudgetSufficient)
                .build();
    }

    // ==========================================
    // CÁC HÀM DÀNH CHO KẾ TOÁN (ACCOUNTANT)
    // ==========================================

    @Transactional
    public void approveByAccountant(Long proposalId, String note) {
        Proposal proposal = getProposalAndValidateStatus(proposalId, ProposalStatus.PENDING_ACCOUNTANT);

        // 1. Kiểm tra ngân sách (Chỉ duyệt khi còn đủ ngân sách)
        BudgetCheckResponse budget = checkProposalBudget(proposalId);
        if (!budget.isBudgetSufficient()) {
            throw new AppException(ErrorCode.OUT_OF_BUDGET);
        }

        // 2. Kiểm tra hạn mức để quyết định luồng duyệt
        if (proposal.getEstimatedTotal() < 5000000.0) {
            // Đề xuất DƯỚI 5 triệu -> Bỏ qua Giám đốc, chuyển thẳng sang Hành chính mua hàng
            proposal.setStatus(ProposalStatus.APPROVED);

            // Ghi log Kế toán duyệt ngân sách
            saveHistoryLog(proposal, ProposalAction.APPROVED_BUDGET, note);

            // Ghi thêm 1 log tự động của hệ thống để minh bạch quá trình duyệt chi
            saveHistoryLog(proposal, ProposalAction.APPROVED_FINAL, "Hệ thống tự động duyệt chi do tổng ngân sách dưới 5.000.000đ");
        } else {
            // Đề xuất TỪ 5 triệu trở lên -> Phải qua Giám đốc duyệt
            proposal.setStatus(ProposalStatus.PENDING_DIRECTOR);
            saveHistoryLog(proposal, ProposalAction.APPROVED_BUDGET, note);
        }

        proposalRepository.save(proposal);
    }

    @Transactional

    public void rejectByAccountant(Long proposalId, String note) {
        Proposal proposal = getProposalAndValidateStatus(proposalId, ProposalStatus.PENDING_ACCOUNTANT);

        // 1. Chuyển trạng thái về Từ chối
        proposal.setStatus(ProposalStatus.REJECTED);

        // 2. Ghi log lịch sử bắt buộc có lý do từ chối
        saveHistoryLog(proposal, ProposalAction.REJECTED, note);
        proposalRepository.save(proposal);
    }

    // ==========================================
    // CÁC HÀM DÀNH CHO GIÁM ĐỐC (DIRECTOR)
    // ==========================================

    // Lấy danh sách chờ Giám đốc duyệt chi
    public Page<ProposalResponse> getPendingDirectorProposals(
            LocalDate startDate, LocalDate endDate, Priority priority, UUID groupId, Pageable pageable) {

        Specification<Proposal> spec = DirectorProposalSpecification.filterPendingProposals(
                startDate, endDate, priority, groupId);

        return proposalRepository.findAll(spec, pageable)
                .map(proposalMapper::toProposalResponse);
    }

    // Giám đốc duyệt chi (Đồng ý)
    @Transactional
    public void approveByDirector(Long proposalId, String note) {
        Proposal proposal = getProposalAndValidateStatus(proposalId, ProposalStatus.PENDING_DIRECTOR);

        // Chuyển sang trạng thái Đã duyệt (Chờ mua hàng)
        proposal.setStatus(ProposalStatus.APPROVED);
        saveHistoryLog(proposal, ProposalAction.APPROVED_FINAL, note);
        proposalRepository.save(proposal);
    }

    // Giám đốc từ chối
    @Transactional
    public void rejectByDirector(Long proposalId, String note) {
        Proposal proposal = getProposalAndValidateStatus(proposalId, ProposalStatus.PENDING_DIRECTOR);

        proposal.setStatus(ProposalStatus.REJECTED);
        saveHistoryLog(proposal, ProposalAction.REJECTED, note);
        proposalRepository.save(proposal);
    }

    // ==========================================
    // CÁC HÀM DÀNH CHO HÀNH CHÍNH (ADMINISTRATIVE_STAFF)
    // ==========================================

    // Lấy danh sách đề xuất đã duyệt (chờ mua)
    public Page<ProposalResponse> getApprovedProposals(
            LocalDate startDate, LocalDate endDate, Priority priority, UUID creatorId, Pageable pageable) {
        Specification<Proposal> spec = AdminStaffProposalSpecification.filterApprovedProposals(
                startDate, endDate, priority, creatorId);
        return proposalRepository.findAll(spec, pageable)
                .map(proposalMapper::toProposalResponse);
    }

    // Xác nhận lưu phiếu mua hàng
    @Transactional
    public void confirmPurchase(Long proposalId, PurchaseConfirmationRequest request) {
        Proposal proposal = getProposalAndValidateStatus(proposalId, ProposalStatus.APPROVED);

        // 1. Cập nhật thông tin mua hàng thực tế
        proposal.setSupplierName(request.getSupplierName());
        proposal.setOrderDate(request.getOrderDate());
        proposal.setDeliveryDate(request.getDeliveryDate());
        proposal.setActualTotal(request.getActualTotal());

        // 2. Lưu file chứng từ, hóa đơn
        if (request.getPurchaseAttachments() != null) {
            for (AttachmentRequest attReq : request.getPurchaseAttachments()) {
                ProposalAttachment attachment = new ProposalAttachment();
                attachment.setFileName(attReq.getFileName());
                attachment.setFileUrl(attReq.getFileUrl());
                attachment.setFileType(attReq.getFileType());
                attachment.setType(AttachmentType.PURCHASE_DOC); // File của hành chính
                attachment.setProposal(proposal);
                proposal.getAttachments().add(attachment);
            }
        }

        // 3. Chuyển trạng thái sang Đang mua hàng (PURCHASING)
        proposal.setStatus(ProposalStatus.PURCHASING);

        // 4. Lưu lịch sử
        saveHistoryLog(proposal, ProposalAction.PURCHASED, request.getNote());
        proposalRepository.save(proposal);
    }
}