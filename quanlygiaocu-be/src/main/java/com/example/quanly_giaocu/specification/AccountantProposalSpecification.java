package com.example.quanly_giaocu.specification;

import com.example.quanly_giaocu.entity.Proposal;
import com.example.quanly_giaocu.enums.Priority;
import com.example.quanly_giaocu.enums.ProposalStatus;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AccountantProposalSpecification {
    public static Specification<Proposal> filterPendingProposals(
            LocalDate startDate,
            LocalDate endDate,
            Priority priority,
            Double minCost,
            Double maxCost,
            UUID groupId,
            UUID creatorId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // BẮT BUỘC: Chỉ lấy các đề xuất đang chờ Kế toán duyệt
            predicates.add(cb.equal(root.get("status"), ProposalStatus.PENDING_ACCOUNTANT));

            // Lọc theo khoảng ngày
            if (startDate != null && endDate != null) {
                predicates.add(cb.between(root.get("createdAt"), startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX)));
            }

            // Lọc theo mức độ ưu tiên
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            // Lọc theo mức chi phí (Tổng chi phí dự kiến)
            if (minCost != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("estimatedTotal"), minCost));
            }
            if (maxCost != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("estimatedTotal"), maxCost));
            }

            // Lọc theo Nhóm chuyên môn (Join từ Proposal -> User -> Group)
            if (groupId != null) {
                predicates.add(cb.equal(root.get("creator").get("group").get("id"), groupId));
            }

            // Lọc theo Người tạo
            if (creatorId != null) {
                predicates.add(cb.equal(root.get("creator").get("id"), creatorId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}