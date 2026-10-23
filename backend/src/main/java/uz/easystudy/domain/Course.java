package uz.easystudy.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@Getter @Setter @NoArgsConstructor
public class Course {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, unique = true, length = 220)
    private String slug;

    @Column(name = "short_description", nullable = false, length = 300)
    private String shortDescription;

    @Column(nullable = false, columnDefinition = "text")
    private String description = "";

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CourseLevel level = CourseLevel.BEGINNER;

    @Column(nullable = false)
    private int price = 0;

    @Column(nullable = false)
    private boolean published = false;

    @Column(nullable = false)
    private boolean featured = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id")
    private User instructor;

    /** Kurs yakunidagi to'liq mock imtihon. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "final_exam_id")
    private Exam finalExam;

    /** Fan ichidagi bosqich raqami (1, 2, 3...); NULL = oddiy kurs. */
    @Column
    private Short stage;

    /** Daraja testidan shu foiz va undan yuqori -> shu bosqich tavsiya etiladi. */
    @Column(name = "min_placement_score", nullable = false)
    private short minPlacementScore = 0;

    /** Ketma-ket rejim: keyingi dars oldingi dars va uning testi bajarilgach ochiladi. */
    @Column(nullable = false)
    private boolean sequential = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC, id ASC")
    private List<Lesson> lessons = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<Quiz> quizzes = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC, id ASC")
    private List<CourseModule> modules = new ArrayList<>();
}
