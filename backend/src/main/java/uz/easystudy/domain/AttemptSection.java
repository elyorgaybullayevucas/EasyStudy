package uz.easystudy.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/** Urinish ichida bitta bo'limning vaqti va natijasi. Bo'limlar ketma-ket ochiladi. */
@Entity
@Table(name = "attempt_sections")
@Getter @Setter @NoArgsConstructor
public class AttemptSection {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attempt_id", nullable = false)
    private Long attemptId;

    @Column(name = "section_id", nullable = false)
    private Long sectionId;

    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "raw_score", precision = 7, scale = 2)
    private BigDecimal rawScore;

    @Column(name = "max_score", precision = 7, scale = 2)
    private BigDecimal maxScore;

    @Column(name = "scaled_score", precision = 7, scale = 2)
    private BigDecimal scaledScore;

    public boolean isOpen(Instant now) {
        return finishedAt == null && now.isBefore(endsAt);
    }
}
