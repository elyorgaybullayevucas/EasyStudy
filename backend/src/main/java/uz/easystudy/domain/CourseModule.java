package uz.easystudy.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Kurs (bosqich) ichidagi bo'lim: mavzular guruhi + bo'lim yakunidagi mock. */
@Entity
@Table(name = "course_modules")
@Getter @Setter @NoArgsConstructor
public class CourseModule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description = "";

    @Column(nullable = false)
    private int position = 0;

    /** Bo'lim yakunidagi mock (bo'limli mashq shablonidan). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id")
    private Exam exam;
}
