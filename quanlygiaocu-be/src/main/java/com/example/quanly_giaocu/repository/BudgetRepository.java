package com.example.quanly_giaocu.repository;

import com.example.quanly_giaocu.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    Optional<Budget> findByYearAndQuarter(int year, int quarter);
}