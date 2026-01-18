package com.example.springaisimple.chat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private final ChatClient chatClient;

    public ChatController(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        log.info("Received chat request: {}", request.message());

        String response = chatClient.prompt()
                .system("""
                    你是一个友好、专业的 AI 助手。
                    请用中文回复用户的问题。
                    回答要准确、清晰、有帮助。
                    如果用户询问书籍推荐，请提供详细的书名、作者和推荐理由。
                    """)
                .user(request.message())
                .advisors(new SimpleLoggerAdvisor())
                .call()
                .content();

        log.info("Generated response length: {}", response.length());

        return new ChatResponse(response);
    }
}
