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

public class DirectorProposalSpecification {
    public static Specification<Proposal> filterPendingProposals(
            LocalDate startDate,
            LocalDate endDate,
            Priority priority,
            UUID groupId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // BẮT BUỘC: Lọc trạng thái chờ Giám đốc duyệt chi
            predicates.add(cb.equal(root.get("status"), ProposalStatus.PENDING_DIRECTOR));

            // Lọc theo ngày Kế toán xác nhận (Trong DB có thể query theo ngày update hoặc tạo)
            if (startDate != null && endDate != null) {
                predicates.add(cb.between(root.get("createdAt"), startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX)));
            }

            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            if (groupId != null) {
                predicates.add(cb.equal(root.get("creator").get("group").get("id"), groupId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}