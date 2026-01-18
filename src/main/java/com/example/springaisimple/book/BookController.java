package com.example.springaisimple.book;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookController {

    private final ChatClient chatClient;

    public BookController(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    /**
     * Native Structured Output Benefits:
     * - No format instructions needed — the schema goes directly to the model's API
     * - Guaranteed compliance — no more parsing failures or malformed JSON
     * - Clean code — just .entity(YourType.class) and you're done
     * - Works with generics — use ParameterizedTypeReference for List<T>
     *
     * Note: Some AI models (e.g., OpenAI) don't support arrays at the top level.
     * We use BookList as a wrapper record to ensure compatibility across providers.
     *
     * @see <a href="https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html">Spring AI Structured Output</a>
     */
    @GetMapping("/books/{topic}")
    public BookList getBooks(@PathVariable String topic) {
        return chatClient.prompt()
                .system( s -> {
                    s.text("""
                        你是一位专业的图书推荐助手，请始终使用中文回复。
                        推荐书籍时请包含书名、作者和简短的推荐理由。
                        """);
                    s.param("topic", topic);
                })
                .user( u -> {
                    u.text("请推荐5本关于主题 {topic} 的热门书籍");
                    u.param("topic", topic);
                })
                .advisors(new SimpleLoggerAdvisor())
                .call()
                .entity(new ParameterizedTypeReference<BookList>() {});
    }
}
