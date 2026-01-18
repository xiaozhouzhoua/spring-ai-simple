package com.example.springaisimple.conversation;

import java.time.LocalDateTime;
import java.util.List;

public record ConversationDTO(
        String id,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<MessageDTO> messages
) {}
