package com.example.caro.repository;

import com.example.caro.entity.ShopItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShopItemRepository extends JpaRepository<ShopItem, Long> {
    List<ShopItem> findByActiveTrue();
    Optional<ShopItem> findByCode(String code);
    boolean existsByCode(String code);
}
