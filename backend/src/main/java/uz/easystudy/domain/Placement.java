package uz.easystudy.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Talabaning fan bo'yicha joylashtirilgan bosqichi (daraja aniqlash testi natijasi). */
@Entity
@Table(name = "placements")
@Getter @Setter @NoArgsConstructor
public class Placement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "attempt_id")
    private Long attemptId;

    @Column(name = "score_percent", nullable = false)
    private short scorePercent;

    @Column(nullable = false)
    private short stage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
