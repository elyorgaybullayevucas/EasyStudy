package uz.easystudy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class EasyStudyApplication {
    public static void main(String[] args) {
        SpringApplication.run(EasyStudyApplication.class, args);
    }
}
