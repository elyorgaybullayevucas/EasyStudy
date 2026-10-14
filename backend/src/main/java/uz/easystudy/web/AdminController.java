package uz.easystudy.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.dto.AuthDtos.UserResponse;
import uz.easystudy.dto.CourseDtos.*;
import uz.easystudy.dto.LearningDtos.*;
import uz.easystudy.dto.PageDto;
import uz.easystudy.security.AuthPrincipal;
import uz.easystudy.service.AdminService;
import uz.easystudy.service.CategoryService;
import uz.easystudy.service.CourseService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class AdminController {

    private final AdminService admin;
    private final CourseService courses;
    private final CategoryService categories;

    @GetMapping("/stats")
    public AdminStats stats() {
        return admin.stats();
    }

    // ---------- kurslar ----------

    @GetMapping("/courses")
    public PageDto<CourseListItem> courses(@RequestParam(required = false) String search,
                                           @RequestParam(defaultValue = "1") int page,
                                           @RequestParam(defaultValue = "50") int size,
                                           @AuthenticationPrincipal AuthPrincipal me) {
        return courses.adminList(search, me, page, size);
    }

    @PostMapping("/courses")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseAdminDetail createCourse(@Valid @RequestBody CourseInput r, @AuthenticationPrincipal AuthPrincipal me) {
        return courses.create(r, me);
    }

    @GetMapping("/courses/{id}")
    public CourseAdminDetail course(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal me) {
        return courses.adminDetail(id, me);
    }

    @PutMapping("/courses/{id}")
    public CourseAdminDetail updateCourse(@PathVariable Long id, @Valid @RequestBody CourseInput r,
                                          @AuthenticationPrincipal AuthPrincipal me) {
        return courses.update(id, r, me);
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal me) {
        courses.delete(id, me);
        return ResponseEntity.noContent().build();
    }

    // ---------- darslar ----------

    @PostMapping("/courses/{courseId}/lessons")
    @ResponseStatus(HttpStatus.CREATED)
    public LessonOut addLesson(@PathVariable Long courseId, @Valid @RequestBody LessonInput r,
                               @AuthenticationPrincipal AuthPrincipal me) {
        return courses.addLesson(courseId, r, me);
    }

    @PutMapping("/lessons/{id}")
    public LessonOut updateLesson(@PathVariable Long id, @Valid @RequestBody LessonInput r,
                                  @AuthenticationPrincipal AuthPrincipal me) {
        return courses.updateLesson(id, r, me);
    }

    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal me) {
        courses.deleteLesson(id, me);
        return ResponseEntity.noContent().build();
    }

    // ---------- kurs testlari ----------

    @PostMapping("/courses/{courseId}/quizzes")
    @ResponseStatus(HttpStatus.CREATED)
    public QuizAdmin createQuiz(@PathVariable Long courseId, @Valid @RequestBody QuizUpsert r,
                                @AuthenticationPrincipal AuthPrincipal me) {
        return admin.createQuiz(courseId, r, me);
    }

    @GetMapping("/quizzes/{id}")
    public QuizAdmin quiz(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal me) {
        return admin.getQuiz(id, me);
    }

    @PutMapping("/quizzes/{id}")
    public QuizAdmin replaceQuiz(@PathVariable Long id, @Valid @RequestBody QuizUpsert r,
                                 @AuthenticationPrincipal AuthPrincipal me) {
        return admin.replaceQuiz(id, r, me);
    }

    @DeleteMapping("/quizzes/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal me) {
        admin.deleteQuiz(id, me);
        return ResponseEntity.noContent().build();
    }

    // ---------- kategoriyalar ----------

    @GetMapping("/categories")
    public List<CategoryDto> categories() {
        return categories.list(false);
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryDto createCategory(@Valid @RequestBody CategoryInput r) {
        return categories.create(r);
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryDto updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryInput r) {
        return categories.update(id, r);
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categories.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- foydalanuvchilar ----------

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public PageDto<UserResponse> users(@RequestParam(required = false) String search,
                                       @RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "50") int size) {
        return admin.listUsers(search, page, size);
    }

    @PatchMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse setRole(@PathVariable Long id, @Valid @RequestBody RoleUpdate r,
                                @AuthenticationPrincipal AuthPrincipal me) {
        return admin.setRole(id, r.role(), me);
    }
}
