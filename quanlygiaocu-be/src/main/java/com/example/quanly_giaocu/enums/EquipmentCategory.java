package com.example.quanly_giaocu.enums;

public enum EquipmentCategory {
    PEN("Bút"),
    PAPER("Giấy"),
    FLASHCARD("Thẻ từ vựng"),
    BOOK("Sách"),
    AUDIO_DEVICE("Thiết bị âm thanh"),
    OTHER("Khác");

    private final String description;

    EquipmentCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}