package com.delta.hunter.controller;

import com.delta.hunter.model.Bounty;
import com.delta.hunter.model.BountyComment;
import com.delta.hunter.model.User;
import com.delta.hunter.repository.BountyCommentRepository;
import com.delta.hunter.repository.BountyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/bounties")
public class BountyController {

    private final BountyRepository bountyRepo;
    private final BountyCommentRepository commentRepo;

    public BountyController(BountyRepository br, BountyCommentRepository cr) {
        this.bountyRepo = br; this.commentRepo = cr;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(defaultValue = "active") String status,
                                  @RequestParam(defaultValue = "1") int page,
                                  @RequestParam(defaultValue = "20") int limit) {
        PageRequest pr = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Bounty> p;

        if ("all".equals(status)) {
            p = bountyRepo.findAll(pr);
        } else {
            try {
                p = bountyRepo.findByStatus(Bounty.Status.valueOf(status), pr);
            } catch (IllegalArgumentException e) {
                p = bountyRepo.findAll(pr);
            }
        }

        List<Map<String, Object>> list = p.getContent().stream().map(this::bountyMap).toList();
        return ResponseEntity.ok(Map.of(
                "bounties", list,
                "total", p.getTotalElements(),
                "page", page,
                "totalPages", p.getTotalPages()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable String id) {
        Bounty b = bountyRepo.findById(id).orElse(null);
        if (b == null) return ResponseEntity.status(404).body(Map.of("error", "通缉令不存在"));

        List<Map<String, Object>> comments = commentRepo.findByBountyIdOrderByCreatedAtAsc(id)
                .stream().map(this::commentMap).toList();

        return ResponseEntity.ok(Map.of("bounty", bountyMap(b), "comments", comments));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body,
                                    @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "请先登录"));
        if (user.isMuted()) return ResponseEntity.status(403).body(Map.of("error", "您已被禁言，无法发布通缉令"));
        String gameId = body.get("game_id");
        String reason = body.get("reason");
        if (gameId == null || reason == null)
            return ResponseEntity.badRequest().body(Map.of("error", "游戏ID和通缉理由不能为空"));

        Bounty b = new Bounty();
        b.setId(UUID.randomUUID().toString());
        b.setCreatorId(user.getId());
        b.setGameId(gameId.trim());
        b.setReason(reason.trim());
        b.setReward(body.getOrDefault("reward", ""));
        bountyRepo.save(b);

        return ResponseEntity.ok(Map.of("id", b.getId(), "message", "通缉令发布成功"));
    }

    @PostMapping("/{id}/hunt")
    @Transactional
    public ResponseEntity<?> hunt(@PathVariable String id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "请先登录"));
        if (user.isMuted()) return ResponseEntity.status(403).body(Map.of("error", "您已被禁言，无法接取通缉令"));
        Bounty b = bountyRepo.findById(id).orElse(null);
        if (b == null) return ResponseEntity.status(404).body(Map.of("error", "通缉令不存在"));
        if (b.getStatus() != Bounty.Status.active)
            return ResponseEntity.badRequest().body(Map.of("error", "该通缉令已被接取或完成"));
        if (b.getCreatorId().equals(user.getId()))
            return ResponseEntity.badRequest().body(Map.of("error", "不能接自己的通缉令"));

        b.setStatus(Bounty.Status.hunting);
        b.setHunterId(user.getId());
        bountyRepo.save(b);
        return ResponseEntity.ok(Map.of("message", "接取成功，快去狩猎吧！"));
    }

    @PostMapping("/{id}/complete")
    @Transactional
    public ResponseEntity<?> complete(@PathVariable String id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "请先登录"));
        Bounty b = bountyRepo.findById(id).orElse(null);
        if (b == null) return ResponseEntity.status(404).body(Map.of("error", "通缉令不存在"));
        if (!b.getCreatorId().equals(user.getId()))
            return ResponseEntity.badRequest().body(Map.of("error", "只有发布者才能确认完成"));
        if (b.getStatus() != Bounty.Status.hunting)
            return ResponseEntity.badRequest().body(Map.of("error", "该通缉令未被接取"));

        b.setStatus(Bounty.Status.completed);
        bountyRepo.save(b);
        return ResponseEntity.ok(Map.of("message", "通缉完成！"));
    }

    @PostMapping("/{id}/cancel")
    @Transactional
    public ResponseEntity<?> cancel(@PathVariable String id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "请先登录"));
        Bounty b = bountyRepo.findById(id).orElse(null);
        if (b == null) return ResponseEntity.status(404).body(Map.of("error", "通缉令不存在"));
        if (!b.getCreatorId().equals(user.getId()))
            return ResponseEntity.badRequest().body(Map.of("error", "只有发布者才能撤销"));

        b.setStatus(Bounty.Status.cancelled);
        bountyRepo.save(b);
        return ResponseEntity.ok(Map.of("message", "通缉令已撤销"));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable String id, @RequestBody Map<String, String> body,
                                        @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "请先登录"));
        if (user.isMuted()) return ResponseEntity.status(403).body(Map.of("error", "您已被禁言，无法发表评论"));
        String content = body.get("content");
        if (content == null || content.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "评论不能为空"));
        if (!bountyRepo.existsById(id))
            return ResponseEntity.status(404).body(Map.of("error", "通缉令不存在"));

        BountyComment c = new BountyComment();
        c.setId(UUID.randomUUID().toString());
        c.setBountyId(id);
        c.setUserId(user.getId());
        c.setContent(content.trim());
        commentRepo.save(c);

        return ResponseEntity.ok(Map.of("comment", commentMap(c)));
    }

    private Map<String, Object> bountyMap(Bounty b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", b.getId());
        m.put("creator_id", b.getCreatorId());
        m.put("game_id", b.getGameId());
        m.put("reason", b.getReason());
        m.put("reward", b.getReward());
        m.put("status", b.getStatus().name());
        m.put("hunter_id", b.getHunterId());
        m.put("created_at", b.getCreatedAt().toString());
        if (b.getCreator() != null) {
            m.put("creator_name", b.getCreator().getUsername());
            m.put("creator_avatar", b.getCreator().getAvatar());
        }
        if (b.getHunter() != null) {
            m.put("hunter_name", b.getHunter().getUsername());
            m.put("hunter_avatar", b.getHunter().getAvatar());
        }
        return m;
    }

    private Map<String, Object> commentMap(BountyComment c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("bounty_id", c.getBountyId());
        m.put("user_id", c.getUserId());
        m.put("content", c.getContent());
        m.put("created_at", c.getCreatedAt().toString());
        if (c.getUser() != null) {
            m.put("username", c.getUser().getUsername());
            m.put("avatar", c.getUser().getAvatar());
        }
        return m;
    }
}
