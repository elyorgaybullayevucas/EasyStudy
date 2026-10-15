package uz.easystudy.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sections")
@Getter @Setter @NoArgsConstructor
public class Section {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(nullable = false)
    private String title;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(name = "audio_key", length = 512)
    private String audioKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "part_type", nullable = false, length = 20)
    private PartType partType = PartType.GENERAL;

    /** Bo'lim boshida talabaga ko'rsatiladigan yo'riqnoma. */
    @Column(columnDefinition = "text")
    private String instructions;

    /** Yangi savol uchun standart ball (DTM: 1.1 / 2.1 / 3.1, IELTS: 1). */
    @Column(name = "default_points", nullable = false, precision = 5, scale = 2)
    private java.math.BigDecimal defaultPoints = java.math.BigDecimal.ONE;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<Question> questions = new ArrayList<>();
}
