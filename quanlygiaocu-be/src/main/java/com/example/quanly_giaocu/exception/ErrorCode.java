package com.example.quanly_giaocu.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    // Các lỗi hệ thống chung
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Message key không hợp lệ", HttpStatus.BAD_REQUEST),

    // Các lỗi liên quan đến User và Xác thực (Auth)
    USER_NOT_EXISTED(1005, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Chưa xác thực, vui lòng đăng nhập", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Bạn không có quyền truy cập tài nguyên này", HttpStatus.FORBIDDEN),
    USERNAME_EXISTED(1008, "Tên đăng nhập đã tồn tại", HttpStatus.BAD_REQUEST),
    PASSWORD_INCORRECT(1009, "Mật khẩu cũ không chính xác", HttpStatus.BAD_REQUEST),

    // Các lỗi Validate dữ liệu đầu vào (Khớp với message trong DTO)
    INVALID_USERNAME(1010, "Tên đăng nhập phải có ít nhất 3 ký tự", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1011, "Mật khẩu phải có ít nhất 8 ký tự", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1012, "Định dạng email không hợp lệ", HttpStatus.BAD_REQUEST),

    GROUP_NOT_EXISTED(1013, "Nhóm không tồn tại", HttpStatus.NOT_FOUND),
    GROUP_EXISTED(1014, "Tên nhóm đã tồn tại", HttpStatus.BAD_REQUEST),


    PROPOSAL_NOT_FOUND(1015, "Không tìm thấy đề xuất", HttpStatus.NOT_FOUND),
    PROPOSAL_CANNOT_EDIT(1016, "Không thể chỉnh sửa đề xuất", HttpStatus.BAD_REQUEST),
    OUT_OF_BUDGET(1017, "Vượt quá hạn mức ngân sách khả dụng của Quý", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}