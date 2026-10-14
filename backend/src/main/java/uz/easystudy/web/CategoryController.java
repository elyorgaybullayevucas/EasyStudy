package uz.easystudy.web;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.easystudy.dto.CourseDtos.CategoryDto;
import uz.easystudy.service.CategoryService;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categories;

    @GetMapping
    public List<CategoryDto> list() {
        return categories.list(true);
    }
}
