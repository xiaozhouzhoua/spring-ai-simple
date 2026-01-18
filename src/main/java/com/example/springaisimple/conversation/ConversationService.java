package com.example.springaisimple.conversation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ConversationService {

    private static final Logger log = LoggerFactory.getLogger(ConversationService.class);

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ChatClient chatClient;

    public ConversationService(ConversationRepository conversationRepository,
                               MessageRepository messageRepository,
                               ChatClient.Builder chatClientBuilder) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.chatClient = chatClientBuilder.build();
    }

    /**
     * 获取所有对话列表
     */
    public List<ConversationDTO> getAllConversations() {
        return conversationRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * 获取单个对话及其消息
     */
    @Transactional(readOnly = true)
    public Optional<ConversationDTO> getConversation(String id) {
        return conversationRepository.findById(id)
                .map(this::toDTOWithMessages);
    }

    /**
     * 创建新对话
     */
    @Transactional
    public ConversationDTO createConversation() {
        Conversation conversation = new Conversation();
        conversation = conversationRepository.save(conversation);
        log.info("Created new conversation: {}", conversation.getId());
        return toDTO(conversation);
    }

    /**
     * 删除对话
     */
    @Transactional
    public void deleteConversation(String id) {
        conversationRepository.deleteById(id);
        log.info("Deleted conversation: {}", id);
    }

    /**
     * 更新对话标题
     */
    @Transactional
    public Optional<ConversationDTO> updateTitle(String id, String title) {
        return conversationRepository.findById(id)
                .map(conversation -> {
                    conversation.setTitle(title);
                    return toDTO(conversationRepository.save(conversation));
                });
    }

    /**
     * 发送消息并获取 AI 回复
     */
    @Transactional
    public MessageDTO sendMessage(String conversationId, String userMessage) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        // 保存用户消息
        Message userMsg = new Message(Message.Role.USER, userMessage);
        conversation.addMessage(userMsg);

        // 如果是第一条消息，自动生成标题
        if (conversation.getMessages().size() == 1) {
            String title = generateTitle(userMessage);
            conversation.setTitle(title);
        }

        // 构建历史消息上下文
        List<org.springframework.ai.chat.messages.Message> historyMessages = buildHistoryMessages(conversation);

        // 调用 AI
        String aiResponse = chatClient.prompt()
                .system("""
                    你是一个友好、专业的 AI 助手。
                    请用中文回复用户的问题。
                    回答要准确、清晰、有帮助。
                    如果用户询问书籍推荐，请提供详细的书名、作者和推荐理由。
                    """)
                .messages(historyMessages)
                .advisors(new SimpleLoggerAdvisor())
                .call()
                .content();

        // 保存 AI 回复
        Message assistantMsg = new Message(Message.Role.ASSISTANT, aiResponse);
        conversation.addMessage(assistantMsg);

        conversationRepository.save(conversation);

        log.info("Message sent in conversation {}, response length: {}", conversationId, aiResponse.length());

        return toMessageDTO(assistantMsg);
    }

    /**
     * 构建历史消息列表
     */
    private List<org.springframework.ai.chat.messages.Message> buildHistoryMessages(Conversation conversation) {
        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();

        // 限制历史消息数量，避免 token 超限
        List<Message> history = conversation.getMessages();
        int startIndex = Math.max(0, history.size() - 20); // 最多保留最近 20 条消息

        for (int i = startIndex; i < history.size(); i++) {
            Message msg = history.get(i);
            if (msg.getRole() == Message.Role.USER) {
                messages.add(new UserMessage(msg.getContent()));
            } else {
                messages.add(new AssistantMessage(msg.getContent()));
            }
        }

        return messages;
    }

    /**
     * 根据第一条消息生成对话标题
     */
    private String generateTitle(String firstMessage) {
        if (firstMessage.length() <= 20) {
            return firstMessage;
        }
        return firstMessage.substring(0, 20) + "...";
    }

    // DTO 转换方法
    private ConversationDTO toDTO(Conversation conversation) {
        return new ConversationDTO(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt(),
                null
        );
    }

    private ConversationDTO toDTOWithMessages(Conversation conversation) {
        List<MessageDTO> messages = conversation.getMessages()
                .stream()
                .map(this::toMessageDTO)
                .toList();

        return new ConversationDTO(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt(),
                messages
        );
    }

    private MessageDTO toMessageDTO(Message message) {
        return new MessageDTO(
                message.getId(),
                message.getRole().name().toLowerCase(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
