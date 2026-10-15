package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import uz.easystudy.domain.BandConversion;

import java.util.List;

public interface BandConversionRepository extends JpaRepository<BandConversion, Long> {
    List<BandConversion> findByExamIdOrderBySectionIdAscMinRawAsc(Long examId);

    @Modifying
    @Query("delete from BandConversion b where b.examId = :examId and b.sectionId is null")
    void deleteOverall(Long examId);

    @Modifying
    @Query("delete from BandConversion b where b.examId = :examId and b.sectionId = :sectionId")
    void deleteForSection(Long examId, Long sectionId);
}
