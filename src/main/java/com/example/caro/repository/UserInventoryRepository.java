package com.example.caro.repository;

import com.example.caro.entity.UserInventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserInventoryRepository extends JpaRepository<UserInventory, Long> {
    List<UserInventory> findByUserId(Long userId);
    Optional<UserInventory> findByUserIdAndItemId(Long userId, Long itemId);
    List<UserInventory> findByUserIdAndEquippedTrue(Long userId);
    boolean existsByUserIdAndItemId(Long userId, Long itemId);
    long countByUserId(Long userId);
}
