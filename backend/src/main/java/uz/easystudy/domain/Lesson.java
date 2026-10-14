package uz.easystudy.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "lessons")
@Getter @Setter @NoArgsConstructor
public class Lesson {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String content = "";

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes = 0;

    @Column(nullable = false)
    private int position = 0;

    /** Ro'yxatdan o'tmaganlarga ham ochiq tanishuv darsi. */
    @Column(nullable = false)
    private boolean preview = false;
}
