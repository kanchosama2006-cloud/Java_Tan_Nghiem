package com.example.caro.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_inventory", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "item_id"})
})
public class UserInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "item_id")
    private ShopItem item;

    @Column(nullable = false)
    private Boolean equipped = false;

    @Column(name = "purchased_at", nullable = false, updatable = false)
    private LocalDateTime purchasedAt;

    @PrePersist
    void onCreate() {
        if (purchasedAt == null) {
            purchasedAt = LocalDateTime.now();
        }
        if (equipped == null) {
            equipped = false;
        }
    }

    public UserInventory() {
    }

    public UserInventory(User user, ShopItem item) {
        this.user = user;
        this.item = item;
        this.equipped = false;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ShopItem getItem() {
        return item;
    }

    public void setItem(ShopItem item) {
        this.item = item;
    }

    public Boolean getEquipped() {
        return equipped != null && equipped;
    }

    public void setEquipped(Boolean equipped) {
        this.equipped = equipped != null && equipped;
    }

    public LocalDateTime getPurchasedAt() {
        return purchasedAt;
    }

    public void setPurchasedAt(LocalDateTime purchasedAt) {
        this.purchasedAt = purchasedAt;
    }
}
