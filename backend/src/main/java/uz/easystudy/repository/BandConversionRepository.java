package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import uz.easystudy.domain.BandConversion;

import java.util.List;
import java.util.Optional;

public interface BandConversionRepository extends JpaRepository<BandConversion, Long> {
    Optional<BandConversion> findFirstByExamIdAndMinRawLessThanEqualAndMaxRawGreaterThanEqual(Long examId, int raw1, int raw2);
    List<BandConversion> findByExamIdOrderByMinRawAsc(Long examId);

    @Modifying
    @Query("delete from BandConversion b where b.examId = :examId")
    void deleteByExamId(Long examId);
}
