package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.easystudy.domain.Role;
import uz.easystudy.domain.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByRole(Role role);
}
