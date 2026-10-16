package com.example.quanly_giaocu.repository;

import com.example.quanly_giaocu.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface GroupRepository extends JpaRepository<Group, UUID> {
    boolean existsByName(String name);
}