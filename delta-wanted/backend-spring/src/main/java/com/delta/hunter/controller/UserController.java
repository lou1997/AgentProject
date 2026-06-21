package com.delta.hunter.controller;

import com.delta.hunter.model.Bounty;
import com.delta.hunter.model.User;
import com.delta.hunter.repository.BountyRepository;
import com.delta.hunter.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepo;
    private final BountyRepository bountyRepo;

    public UserController(UserRepository ur, BountyRepository br) {
        this.userRepo = ur; this.bountyRepo = br;
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String q, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "请先登录"));
        if (q == null || q.isBlank()) return ResponseEntity.ok(Map.of("users", List.of()));

        List<Map<String, Object>> users = userRepo
                .findByIdNotAndUsernameContainingIgnoreCase(user.getId(), q)
                .stream()
                .limit(10)
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("avatar", u.getAvatar());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(Map.of("users", users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> profile(@PathVariable String id) {
        User user = userRepo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "用户不存在"));

        long posted = bountyRepo.countByCreatorId(id);
        long hunted = bountyRepo.countByHunterIdAndStatus(id, Bounty.Status.completed);

        Map<String, Object> um = new LinkedHashMap<>();
        um.put("id", user.getId());
        um.put("username", user.getUsername());
        um.put("avatar", user.getAvatar());
        um.put("created_at", user.getCreatedAt().toString());

        return ResponseEntity.ok(Map.of(
                "user", um,
                "stats", Map.of("posted", posted, "hunted", hunted)
        ));
    }
}
