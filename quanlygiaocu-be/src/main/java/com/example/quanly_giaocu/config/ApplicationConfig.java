package com.example.quanly_giaocu.config;

import com.example.quanly_giaocu.entity.Group;
import com.example.quanly_giaocu.entity.Budget;
import com.example.quanly_giaocu.entity.User;
import com.example.quanly_giaocu.enums.Role;
import com.example.quanly_giaocu.repository.BudgetRepository;
import com.example.quanly_giaocu.repository.GroupRepository;
import com.example.quanly_giaocu.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@Slf4j
@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationConfig {

    PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository,
                                        GroupRepository groupRepository,
                                        BudgetRepository budgetRepository) {
        return args -> {
            // 1. KHỞI TẠO CÁC PHÒNG BAN VÀ NHÓM CHUYÊN MÔN
            Group khoiMamNon = getOrCreateGroup(groupRepository, "Khối Mầm non (SuperKids)");
            Group khoiThieuNhi = getOrCreateGroup(groupRepository, "Khối Tiếng Anh Thiếu Nhi");
            Group khoiIelts = getOrCreateGroup(groupRepository, "IELTS Academic");
            Group banTaiChinh = getOrCreateGroup(groupRepository, "Ban Tài chính - Kế toán");
            Group phongHanhChinh = getOrCreateGroup(groupRepository, "Phòng Hành chính - Quản trị");
            Group banGiamDoc = getOrCreateGroup(groupRepository, "Ban Giám đốc");

            int currentYear = LocalDate.now().getYear();
            int currentQuarter = (LocalDate.now().getMonthValue() - 1) / 3 + 1;

            createBudgetIfNotExist(budgetRepository, currentYear, currentQuarter, 100000000.0);

            // 3. KHỞI TẠO TÀI KHOẢN (Mật khẩu mặc định: 12345678)
            String defaultPass = passwordEncoder.encode("12345678");

            // 3.1. Role: ADMIN
            createUserIfNotExist(userRepository, "admin", defaultPass, "Quản trị viên Hệ thống", "System Admin", null, null, Role.ADMIN);

            // 3.2. Role: DIRECTOR
            createUserIfNotExist(userRepository, "giamdoc", defaultPass, "Vũ Đình Hùng", "Giám đốc Trung tâm", "giamdoc@eduprocure.com", banGiamDoc, Role.DIRECTOR);

            // 3.3. Role: ACCOUNTANT
            createUserIfNotExist(userRepository, "ketoan", defaultPass, "Phạm Thị Mai", "Kế toán viên", "ketoan@eduprocure.com", banTaiChinh, Role.ACCOUNTANT);

            // 3.4. Role: ADMINISTRATIVE_STAFF
            createUserIfNotExist(userRepository, "hanhchinh", defaultPass, "Lê Ngọc Bích", "Nhân viên Hành chính", "hanhchinh@eduprocure.com", phongHanhChinh, Role.ADMINISTRATIVE_STAFF);

            // 3.5. Role: MANAGER
            createUserIfNotExist(userRepository, "quanly1", defaultPass, "Nguyễn Minh Khang", "Quản lý chuyên môn", "manager.ielts@eduprocure.com", khoiIelts, Role.MANAGER);
            createUserIfNotExist(userRepository, "quanly2", defaultPass, "Hoàng Phương Ly", "Quản lý chuyên môn", "manager.mamnon@eduprocure.com", khoiMamNon, Role.MANAGER);

            // 3.6. Role: TEACHER (Tạo nhiều giáo viên cho các khối khác nhau)
            createUserIfNotExist(userRepository, "truongnhom1", defaultPass, "Trần Thu Hà", "Trưởng nhóm chuyên môn", "tn1.mamnon@eduprocure.com", khoiMamNon, Role.TEACHER);
            createUserIfNotExist(userRepository, "truongnhom2", defaultPass, "Nguyễn Thị Hoa", "Trưởng nhóm chuyên môn", "tn2.mamnon@eduprocure.com", khoiMamNon, Role.TEACHER);
            createUserIfNotExist(userRepository, "truongnhom3", defaultPass, "Phạm Văn Nam", "Trưởng nhóm chuyên môn", "tn1.thieunhi@eduprocure.com", khoiThieuNhi, Role.TEACHER);
            createUserIfNotExist(userRepository, "truongnhom4", defaultPass, "Lê Bảo Phương", "Trưởng nhóm chuyên môn", "tn1.ielts@eduprocure.com", khoiIelts, Role.TEACHER);

            log.info("Đã khởi tạo thành công Dữ liệu Phòng ban, Ngân sách và Tài khoản mẫu!");
        };
    }

    // Helper: Lấy hoặc tạo mới Group
    private Group getOrCreateGroup(GroupRepository groupRepository, String name) {
        return groupRepository.findAll().stream()
                .filter(g -> g.getName().equals(name))
                .findFirst()
                .orElseGet(() -> groupRepository.save(Group.builder().name(name).fundBalance(0.0).build()));
    }

    // Helper: Tạo ngân sách cho nhóm nếu chưa có
    private void createBudgetIfNotExist(BudgetRepository budgetRepository,int year, int quarter, Double amount) {
        if (budgetRepository.findByYearAndQuarter(year, quarter).isEmpty()) {
            Budget budget = Budget.builder()
                    .year(year)
                    .quarter(quarter)
                    .allocatedAmount(amount)
                    .build();
            budgetRepository.save(budget);
        }
    }

    // Helper: Tạo user nếu chưa tồn tại
    private void createUserIfNotExist(UserRepository userRepository, String username, String password,
                                      String fullName, String position, String email, Group group, Role role) {
        if (userRepository.findByUsername(username).isEmpty()) {
            User user = User.builder()
                    .username(username)
                    .password(password)
                    .fullName(fullName)
                    .position(position)
                    .email(email)
                    .group(group)
                    .role(role)
                    .build();
            userRepository.save(user);
        }
    }
}