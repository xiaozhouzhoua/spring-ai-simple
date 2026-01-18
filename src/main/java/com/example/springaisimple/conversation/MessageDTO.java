package com.example.springaisimple.conversation;

import java.time.LocalDateTime;

public record MessageDTO(
        String id,
        String role,
        String content,
        LocalDateTime createdAt
) {}
