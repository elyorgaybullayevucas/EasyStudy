package uz.examprep.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "band_conversion")
@Getter @Setter @NoArgsConstructor
public class BandConversion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exam_id", nullable = false)
    private Long examId;

    @Column(name = "min_raw", nullable = false)
    private int minRaw;

    @Column(name = "max_raw", nullable = false)
    private int maxRaw;

    @Column(nullable = false, precision = 7, scale = 2)
    private BigDecimal scaled;
}
