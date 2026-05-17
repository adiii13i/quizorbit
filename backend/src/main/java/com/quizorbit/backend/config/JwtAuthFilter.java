package com.quizorbit.backend.config;

import com.quizorbit.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String token = authHeader.substring(7);
            final String email = jwtUtil.extractEmail(token);
            final String role = jwtUtil.extractRole(token);

            if (email != null &&
                SecurityContextHolder.getContext()
                                     .getAuthentication() == null) {

                boolean userExists =
                        userRepository.existsByEmail(email);

                if (userExists &&
                        jwtUtil.isTokenValid(token, email)) {

                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of(new SimpleGrantedAuthority(
                                    "ROLE_" + role))
                        );

                    authToken.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                    );

                    SecurityContextHolder.getContext()
                                         .setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Invalid token — continue without auth
        }

        filterChain.doFilter(request, response);
    }
}