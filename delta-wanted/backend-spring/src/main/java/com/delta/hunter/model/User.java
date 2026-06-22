package com.delta.hunter.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    private String id;

    @Column(unique = true, nullable = false, length = 20)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(length = 500)
    private String avatar = "";

    private String role = "user";

    private boolean muted = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public User() {}
    public User(String id, String username, String password) {
        this.id = id; this.username = username; this.password = password;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String n) { this.username = n; }
    public String getPassword() { return password; }
    public void setPassword(String p) { this.password = p; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String a) { this.avatar = a; }
    public String getRole() { return role; }
    public void setRole(String r) { this.role = r; }
    public boolean isMuted() { return muted; }
    public void setMuted(boolean m) { this.muted = m; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime d) { this.createdAt = d; }
}
