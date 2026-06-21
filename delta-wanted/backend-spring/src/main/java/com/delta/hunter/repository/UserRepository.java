package com.delta.hunter.repository;

import com.delta.hunter.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    List<User> findByIdNotAndUsernameContainingIgnoreCase(String id, String query);
}
