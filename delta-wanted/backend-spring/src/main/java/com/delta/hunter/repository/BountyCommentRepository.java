package com.delta.hunter.repository;

import com.delta.hunter.model.BountyComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BountyCommentRepository extends JpaRepository<BountyComment, String> {
    List<BountyComment> findByBountyIdOrderByCreatedAtAsc(String bountyId);
}
