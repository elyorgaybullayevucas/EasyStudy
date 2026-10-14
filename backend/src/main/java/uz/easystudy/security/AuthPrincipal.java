package uz.easystudy.security;

import uz.easystudy.domain.Role;

public record AuthPrincipal(Long id, String email, Role role) {}
