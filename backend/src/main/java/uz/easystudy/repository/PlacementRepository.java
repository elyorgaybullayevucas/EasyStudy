package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.easystudy.domain.Placement;

import java.util.List;
import java.util.Optional;

public interface PlacementRepository extends JpaRepository<Placement, Long> {
    Optional<Placement> findByUserIdAndCategoryId(Long userId, Long categoryId);
    List<Placement> findByUserId(Long userId);
}
