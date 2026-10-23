package uz.easystudy.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "categories")
@Getter @Setter @NoArgsConstructor
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    @Column(length = 50)
    private String icon;

    @Enumerated(EnumType.STRING)
    @Column(name = "grp", nullable = false, length = 30)
    private CategoryGroup group = CategoryGroup.OTHER;

    @Column(nullable = false)
    private int position = 100;

    /** Fan uchun daraja aniqlash (joylashtirish) testi. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "placement_exam_id")
    private Exam placementExam;

    /** Shu fan tayyorlaydigan sertifikat kategoriyalari sluglari (vergul bilan). */
    @Column(name = "cert_slugs", length = 200)
    private String certSlugs;

    /** Fanga mas'ul o'qituvchilar: fandagi barcha kurs/imtihonlarni boshqaradi. */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "category_teachers", joinColumns = @JoinColumn(name = "category_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    private java.util.Set<User> teachers = new java.util.HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
