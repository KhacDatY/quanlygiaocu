package com.example.quanly_giaocu.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Collections;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public FilterRegistrationBean<CorsFilter> customCorsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // 1. Cho phép gửi thông tin xác thực (Cookie, Authorization Header)
        config.setAllowCredentials(true);

        // 2. Chấp nhận các origin chạy từ Vite / React local
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:[*]",
                "http://127.0.0.1:[*]"
        ));

        // 3. Cho phép tất cả các Header cần thiết
        config.setAllowedHeaders(List.of(
                "Origin",
                "Content-Type",
                "Accept",
                "Authorization",
                "X-Requested-With",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));

        // 4. Cho phép đầy đủ các phương thức HTTP
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // 5. Cấu hình Cache preflight request trong 1 giờ để giảm tải OPTIONS gọi liên tục
        config.setMaxAge(3600L);

        source.registerCorsConfiguration("/**", config);

        // ĐẶT ĐỘ ƯU TIÊN CAO NHẤT ĐỂ ĐẢM BẢO CHẠY TRƯỚC SPRING SECURITY
        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}