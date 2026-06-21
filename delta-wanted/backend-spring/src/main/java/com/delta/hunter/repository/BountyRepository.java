package com.delta.hunter.repository;

import com.delta.hunter.model.Bounty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BountyRepository extends JpaRepository<Bounty, String> {
    Page<Bounty> findByStatus(Bounty.Status status, Pageable pageable);
    long countByCreatorId(String creatorId);
    long countByHunterIdAndStatus(String hunterId, Bounty.Status status);
}
