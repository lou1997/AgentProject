package com.delta.hunter.controller;

import com.delta.hunter.config.JwtUtil;
import com.delta.hunter.dto.AuthRequest;
import com.delta.hunter.model.User;
import com.delta.hunter.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository ur, PasswordEncoder pe, JwtUtil jt) {
        this.userRepo = ur; this.passwordEncoder = pe; this.jwtUtil = jt;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest req) {
        if (req.getUsername() == null || req.getPassword() == null)
            return ResponseEntity.badRequest().body(Map.of("error", "用户名和密码不能为空"));
        if (req.getUsername().length() < 2 || req.getUsername().length() > 20)
            return ResponseEntity.badRequest().body(Map.of("error", "用户名2-20个字符"));
        if (req.getPassword().length() < 6)
            return ResponseEntity.badRequest().body(Map.of("error", "密码至少6位"));
        if (userRepo.findByUsername(req.getUsername()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("error", "用户名已存在"));

        User user = new User(UUID.randomUUID().toString(), req.getUsername(),
                passwordEncoder.encode(req.getPassword()));
        userRepo.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return ResponseEntity.ok(Map.of("token", token, "user", userMap(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req) {
        User user = userRepo.findByUsername(req.getUsername())
                .orElse(null);
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPassword()))
            return ResponseEntity.badRequest().body(Map.of("error", "用户名或密码错误"));

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return ResponseEntity.ok(Map.of("token", token, "user", userMap(user)));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        return ResponseEntity.ok(Map.of("user", userMap(user)));
    }

    static Map<String, Object> userMap(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        m.put("avatar", u.getAvatar());
        return m;
    }
}
