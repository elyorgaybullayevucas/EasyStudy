package uz.easystudy.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "answers", uniqueConstraints = @UniqueConstraint(columnNames = {"attempt_id", "question_id"}))
@Getter @Setter @NoArgsConstructor
public class Answer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private Attempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    /** {"value":"A"} | {"values":["A","C"]} | {"text":"essay..."} */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> response;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(precision = 5, scale = 2)
    private BigDecimal points;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    /** O'qituvchi izohi (Writing/Speaking). */
    @Column(columnDefinition = "text")
    private String feedback;

    @Column(name = "graded_by")
    private Long gradedBy;
}
