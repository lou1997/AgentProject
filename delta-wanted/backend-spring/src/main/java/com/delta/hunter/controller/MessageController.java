package com.delta.hunter.controller;

import com.delta.hunter.model.Message;
import com.delta.hunter.model.User;
import com.delta.hunter.repository.MessageRepository;
import com.delta.hunter.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository msgRepo;
    private final UserRepository userRepo;

    public MessageController(MessageRepository mr, UserRepository ur) {
        this.msgRepo = mr; this.userRepo = ur;
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> conversations(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "请先登录"));

        List<Message> all = msgRepo.findAllByUser(user.getId());
        Map<String, Message> lastMsgs = new LinkedHashMap<>();
        Map<String, Long> unread = new LinkedHashMap<>();

        for (Message m : all) {
            String other = m.getFromId().equals(user.getId()) ? m.getToId() : m.getFromId();
            if (!lastMsgs.containsKey(other) || m.getCreatedAt().isAfter(lastMsgs.get(other).getCreatedAt())) {
                lastMsgs.put(other, m);
            }
            if (m.getToId().equals(user.getId()) && !m.isRead()) {
                unread.merge(m.getFromId(), 1L, Long::sum);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Message> e : lastMsgs.entrySet()) {
            String uid = e.getKey();
            User u = userRepo.findById(uid).orElse(null);
            if (u == null) continue;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", uid);
            item.put("username", u.getUsername());
            item.put("avatar", u.getAvatar());
            item.put("last_msg", e.getValue().getContent());
            item.put("last_time", e.getValue().getCreatedAt().toString());
            item.put("unread", unread.getOrDefault(uid, 0L));
            result.add(item);
        }

        return ResponseEntity.ok(Map.of("conversations", result));
    }

    @GetMapping("/with/{userId}")
    @Transactional
    public ResponseEntity<?> withUser(@PathVariable String userId,
                                      @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "请先登录"));

        msgRepo.markAsRead(user.getId(), userId);

        List<Map<String, Object>> msgs = msgRepo.findConversation(user.getId(), userId)
                .stream().map(this::msgMap).toList();
        return ResponseEntity.ok(Map.of("messages", msgs));
    }

    @PostMapping
    public ResponseEntity<?> send(@RequestBody Map<String, String> body,
                                  @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "请先登录"));

        String toId = body.get("to_id");
        String content = body.get("content");
        if (toId == null || content == null)
            return ResponseEntity.badRequest().body(Map.of("error", "收件人和内容不能为空"));
        if (!userRepo.existsById(toId))
            return ResponseEntity.status(404).body(Map.of("error", "用户不存在"));

        Message m = new Message();
        m.setId(UUID.randomUUID().toString());
        m.setFromId(user.getId());
        m.setToId(toId);
        m.setContent(content.trim());
        msgRepo.save(m);

        return ResponseEntity.ok(Map.of("message", msgMap(m)));
    }

    private Map<String, Object> msgMap(Message m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("from_id", m.getFromId());
        map.put("to_id", m.getToId());
        map.put("content", m.getContent());
        map.put("is_read", m.isRead());
        map.put("created_at", m.getCreatedAt().toString());
        if (m.getFromUser() != null) map.put("from_name", m.getFromUser().getUsername());
        if (m.getToUser() != null) map.put("to_name", m.getToUser().getUsername());
        return map;
    }
}
