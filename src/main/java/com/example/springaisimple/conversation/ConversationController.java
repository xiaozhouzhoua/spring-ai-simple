package com.example.springaisimple.conversation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private static final Logger log = LoggerFactory.getLogger(ConversationController.class);

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    /**
     * 获取所有对话列表
     */
    @GetMapping
    public List<ConversationDTO> getAllConversations() {
        return conversationService.getAllConversations();
    }

    /**
     * 获取单个对话（包含消息）
     */
    @GetMapping("/{id}")
    public ResponseEntity<ConversationDTO> getConversation(@PathVariable String id) {
        return conversationService.getConversation(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 创建新对话
     */
    @PostMapping
    public ConversationDTO createConversation() {
        return conversationService.createConversation();
    }

    /**
     * 删除对话
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable String id) {
        conversationService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 更新对话标题
     */
    @PatchMapping("/{id}")
    public ResponseEntity<ConversationDTO> updateTitle(
            @PathVariable String id,
            @RequestBody UpdateTitleRequest request) {
        return conversationService.updateTitle(id, request.title())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 发送消息
     */
    @PostMapping("/{id}/messages")
    public MessageDTO sendMessage(
            @PathVariable String id,
            @RequestBody SendMessageRequest request) {
        log.info("Received message for conversation {}: {}", id, request.message());
        return conversationService.sendMessage(id, request.message());
    }

    // Request DTOs
    public record UpdateTitleRequest(String title) {}
    public record SendMessageRequest(String message) {}
}
