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

public class AdminStaffProposalSpecification {
    public static Specification<Proposal> filterApprovedProposals(
            LocalDate startDate,
            LocalDate endDate,
            Priority priority,
            UUID creatorId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // CHỈ LẤY CÁC ĐỀ XUẤT ĐÃ ĐƯỢC GIÁM ĐỐC DUYỆT (CHỜ MUA)
            predicates.add(cb.equal(root.get("status"), ProposalStatus.APPROVED));

            // Lọc theo ngày (Trong hệ thống hiện tại có thể dựa vào createdAt hoặc ngày duyệt)
            if (startDate != null && endDate != null) {
                predicates.add(cb.between(root.get("createdAt"), startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX)));
            }

            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            if (creatorId != null) {
                predicates.add(cb.equal(root.get("creator").get("id"), creatorId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}