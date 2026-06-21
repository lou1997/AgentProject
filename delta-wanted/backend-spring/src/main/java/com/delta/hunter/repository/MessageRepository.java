package com.delta.hunter.repository;

import com.delta.hunter.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {

    @Query("SELECT m FROM Message m WHERE (m.fromId = :u1 AND m.toId = :u2) OR (m.fromId = :u2 AND m.toId = :u1) ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("u1") String u1, @Param("u2") String u2);

    @Query("SELECT m FROM Message m WHERE m.fromId = :userId OR m.toId = :userId ORDER BY m.createdAt DESC")
    List<Message> findAllByUser(@Param("userId") String userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.toId = :userId AND m.fromId = :fromId AND m.isRead = false")
    int markAsRead(@Param("userId") String userId, @Param("fromId") String fromId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.toId = :userId AND m.isRead = false")
    long countUnread(@Param("userId") String userId);
}
