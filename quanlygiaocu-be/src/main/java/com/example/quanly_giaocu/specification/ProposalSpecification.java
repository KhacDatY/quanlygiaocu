package com.example.quanly_giaocu.specification;

import com.example.quanly_giaocu.entity.Proposal;
import com.example.quanly_giaocu.enums.ProposalStatus;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ProposalSpecification {

    public static Specification<Proposal> filterMyProposals(
            UUID creatorId,
            ProposalStatus status,
            LocalDate startDate,
            LocalDate endDate,
            String code) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Điều kiện BẮT BUỘC: Chỉ lấy đề xuất của chính User đang đăng nhập
            predicates.add(cb.equal(root.get("creator").get("id"), creatorId));

            // 2. Điều kiện KHÔNG BẮT BUỘC: Lọc theo trạng thái
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // 3. Điều kiện KHÔNG BẮT BUỘC: Lọc theo khoảng ngày tạo
            if (startDate != null && endDate != null) {
                // Chuyển LocalDate thành LocalDateTime (Tùy khoảng 00:00:00 ngày bắt đầu đến 23:59:59 ngày kết thúc)
                predicates.add(cb.between(root.get("createdAt"),
                        startDate.atStartOfDay(),
                        endDate.atTime(LocalTime.MAX)));
            } else if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            } else if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate.atTime(LocalTime.MAX)));
            }

            // 4. Điều kiện KHÔNG BẮT BUỘC: Tìm kiếm gần đúng theo mã đề xuất (Không phân biệt hoa thường)
            if (code != null && !code.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("code")), "%" + code.toLowerCase() + "%"));
            }

            // Gộp tất cả các điều kiện lại bằng AND
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}