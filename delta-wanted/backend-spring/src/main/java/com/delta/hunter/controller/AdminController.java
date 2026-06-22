package com.delta.hunter.controller;

import com.delta.hunter.model.User;
import com.delta.hunter.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepo;

    public AdminController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers() {
        List<User> all = userRepo.findAll();
        List<Map<String, Object>> users = new ArrayList<>();
        for (User u : all) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("role", u.getRole());
            m.put("muted", u.isMuted());
            m.put("created_at", u.getCreatedAt().toString());
            users.add(m);
        }
        return ResponseEntity.ok(Map.of("users", users));
    }

    @PostMapping("/users/{id}/mute")
    @Transactional
    public ResponseEntity<?> muteUser(@PathVariable String id) {
        User user = userRepo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "用户不存在"));
        if ("admin".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.badRequest().body(Map.of("error", "不能禁言管理员"));
        user.setMuted(true);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "用户已被禁言"));
    }

    @PostMapping("/users/{id}/unmute")
    @Transactional
    public ResponseEntity<?> unmuteUser(@PathVariable String id) {
        User user = userRepo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "用户不存在"));
        user.setMuted(false);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "已解除禁言"));
    }
}
