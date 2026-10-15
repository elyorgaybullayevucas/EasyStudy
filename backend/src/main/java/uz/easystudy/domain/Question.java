package uz.easystudy.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "questions")
@Getter @Setter @NoArgsConstructor
public class Question {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private QuestionType type;

    @Column(nullable = false, columnDefinition = "text")
    private String prompt;

    @Column(columnDefinition = "text")
    private String passage;

    /** [{"key":"A","text":"..."}] */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> options;

    /** {"accepted":["A"]} - NEVER serialised to the client. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "answer_key", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> answerKey;

    /** Maksimal ball. ESSAY/SPEAKING uchun band shkalasi (IELTS: 9). */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal points = BigDecimal.ONE;

    /** Qo'lda baholanadigan bo'limda o'rtacha hisoblashdagi vazn (IELTS Writing Task 2 = 2). */
    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal weight = BigDecimal.ONE;

    /** Rasm (grafik, diagramma, cue card) saqlash kaliti. */
    @Column(name = "image_key", length = 255)
    private String imageKey;

    /** Writing: minimal so'z soni. */
    @Column(name = "min_words")
    private Integer minWords;

    /** Speaking: tayyorlanish va javob vaqti (soniya). */
    @Column(name = "prep_seconds")
    private Integer prepSeconds;

    @Column(name = "answer_seconds")
    private Integer answerSeconds;
}
