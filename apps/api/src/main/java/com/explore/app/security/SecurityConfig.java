package com.explore.app.security;

import java.util.List;

import com.explore.app.security.jwt.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                return http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(Customizer.withDefaults())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .formLogin(form -> form.disable())
                                .httpBasic(basic -> basic.disable())
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/error").permitAll()

                                                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register")
                                                .permitAll()
                                                .requestMatchers("/api/public/**").permitAll()
                                                .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()

                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/manager/**").hasAnyRole("ADMIN", "MANAGER")

                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                                .build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOriginPatterns(List.of(
                                "http://localhost:*",
                                "http://127.0.0.1:*"));

                config.setAllowedMethods(List.of(
                                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

                config.setAllowedHeaders(List.of(
                                "Authorization",
                                "Content-Type",
                                "Accept"));

                config.setExposedHeaders(List.of(
                                "Authorization"));

                config.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }
}


