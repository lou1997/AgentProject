package com.delta.hunter.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bounties")
public class Bounty {
    public enum Status { active, hunting, completed, cancelled }

    @Id
    private String id;

    @Column(name = "creator_id", nullable = false)
    private String creatorId;

    @Column(name = "game_id", nullable = false)
    private String gameId;

    @Column(nullable = false, length = 2000)
    private String reason;

    @Column(length = 500)
    private String reward = "";

    @Enumerated(EnumType.STRING)
    private Status status = Status.active;

    @Column(name = "hunter_id")
    private String hunterId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "creator_id", insertable = false, updatable = false)
    private User creator;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hunter_id", insertable = false, updatable = false)
    private User hunter;

    public Bounty() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCreatorId() { return creatorId; }
    public void setCreatorId(String id) { this.creatorId = id; }
    public String getGameId() { return gameId; }
    public void setGameId(String g) { this.gameId = g; }
    public String getReason() { return reason; }
    public void setReason(String r) { this.reason = r; }
    public String getReward() { return reward; }
    public void setReward(String r) { this.reward = r; }
    public Status getStatus() { return status; }
    public void setStatus(Status s) { this.status = s; }
    public String getHunterId() { return hunterId; }
    public void setHunterId(String id) { this.hunterId = id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime d) { this.createdAt = d; }
    public User getCreator() { return creator; }
    public User getHunter() { return hunter; }
}
