package com.example.quanly_giaocu.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class StringUtils {
    public static String removeAccents(String str) {
        if (str == null) return "";
        String nfdNormalizedString = Normalizer.normalize(str, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(nfdNormalizedString).replaceAll("")
                .replace('đ', 'd').replace('Đ', 'D')
                .toLowerCase()
                .trim();
    }

    public static String getAbbreviatedName(String fullName) {
        String cleanName = removeAccents(fullName);
        String[] parts = cleanName.split("\\s+");
        if (parts.length == 0) return "user";

        StringBuilder sb = new StringBuilder(parts[parts.length - 1]);

        for (int i = 0; i < parts.length - 1; i++) {
            sb.append(parts[i].charAt(0));
        }
        return sb.toString();
    }
}