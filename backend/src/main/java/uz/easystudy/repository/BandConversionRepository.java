package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.easystudy.domain.BandConversion;

import java.util.Optional;

public interface BandConversionRepository extends JpaRepository<BandConversion, Long> {
    Optional<BandConversion> findFirstByExamIdAndMinRawLessThanEqualAndMaxRawGreaterThanEqual(Long examId, int raw1, int raw2);
}
