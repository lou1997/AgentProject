package com.delta.hunter.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bounty_comments")
public class BountyComment {
    @Id
    private String id;

    @Column(name = "bounty_id", nullable = false)
    private String bountyId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    public BountyComment() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBountyId() { return bountyId; }
    public void setBountyId(String id) { this.bountyId = id; }
    public String getUserId() { return userId; }
    public void setUserId(String id) { this.userId = id; }
    public String getContent() { return content; }
    public void setContent(String c) { this.content = c; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime d) { this.createdAt = d; }
    public User getUser() { return user; }
}
