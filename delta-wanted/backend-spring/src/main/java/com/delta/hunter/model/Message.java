package com.delta.hunter.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {
    @Id
    private String id;

    @Column(name = "from_id", nullable = false)
    private String fromId;

    @Column(name = "to_id", nullable = false)
    private String toId;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(name = "is_read")
    private boolean isRead = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "from_id", insertable = false, updatable = false)
    private User fromUser;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "to_id", insertable = false, updatable = false)
    private User toUser;

    public Message() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFromId() { return fromId; }
    public void setFromId(String id) { this.fromId = id; }
    public String getToId() { return toId; }
    public void setToId(String id) { this.toId = id; }
    public String getContent() { return content; }
    public void setContent(String c) { this.content = c; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean r) { this.isRead = r; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime d) { this.createdAt = d; }
    public User getFromUser() { return fromUser; }
    public User getToUser() { return toUser; }
}
