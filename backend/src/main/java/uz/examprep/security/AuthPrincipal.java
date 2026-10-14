package uz.examprep.security;

import uz.examprep.domain.Role;

public record AuthPrincipal(Long id, String email, Role role) {}
