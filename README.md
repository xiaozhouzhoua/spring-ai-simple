# 🤖 Spring AI 聊天助手

一个基于 Spring AI 和 Anthropic Claude 的智能聊天应用，支持多轮对话、历史记录持久化和结构化输出。

## ✨ 功能特性

- 🗣️ **智能对话** - 基于 Claude Sonnet 4.5 模型的自然语言交互
- 💾 **对话持久化** - 使用 H2 数据库存储聊天历史，支持多会话管理
- 📚 **图书推荐** - 结构化输出示例，返回类型安全的 JSON 数据
- 🎨 **现代化 UI** - 仿 ChatGPT 风格的响应式聊天界面
- 🌙 **代码高亮** - 支持多种编程语言的语法高亮显示
- 📝 **Markdown 渲染** - 完整支持 Markdown 格式的消息展示

## 🏗️ 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.5.9 | 应用框架 |
| Spring AI | 1.1.2 | AI 集成框架 |
| Anthropic Claude | Sonnet 4.5 | 大语言模型 |
| H2 Database | - | 嵌入式数据库 |
| Java | 25 | 运行环境 |

## 📁 项目结构

```
src/main/java/com/example/springaisimple/
├── SpringAISimpleApplication.java    # 应用入口
├── book/                              # 图书推荐模块（结构化输出示例）
│   ├── Book.java                      # 图书实体 Record
│   ├── BookList.java                  # 图书列表包装器
│   └── BookController.java            # 图书推荐 API
├── chat/                              # 简单聊天模块
│   ├── ChatRequest.java               # 聊天请求 DTO
│   ├── ChatResponse.java              # 聊天响应 DTO
│   └── ChatController.java            # 聊天 API
└── conversation/                      # 多轮对话模块
    ├── Conversation.java              # 对话实体
    ├── Message.java                   # 消息实体
    ├── ConversationDTO.java           # 对话 DTO
    ├── MessageDTO.java                # 消息 DTO
    ├── ConversationRepository.java    # 对话仓库
    ├── MessageRepository.java         # 消息仓库
    ├── ConversationService.java       # 对话服务
    └── ConversationController.java    # 对话 API
```

## 🚀 快速开始

### 环境要求

- Java 25+
- Maven 3.8+
- Anthropic API Key（或兼容的代理服务）

### 配置说明

编辑 `src/main/resources/application.yaml`：

```yaml
spring:
  ai:
    anthropic:
      # API 密钥（必填）
      api-key: your-api-key-here
      # API 地址（可选，默认为官方地址）
      base-url: https://api.anthropic.com
      chat:
        options:
          # 模型选择
          model: claude-sonnet-4-5-20250929
```

### 运行项目

```bash
# 克隆项目
git clone https://github.com/xiaozhouzhoua/spring-ai-simple.git
cd spring-ai-simple

# 运行应用
./mvnw spring-boot:run
```

访问 http://localhost:8080 即可使用聊天界面。

## 📡 API 接口

### 聊天接口

```bash
# 简单聊天
POST /api/chat
Content-Type: application/json

{"message": "你好，请介绍一下自己"}
```

### 对话管理接口

```bash
# 获取所有对话
GET /api/conversations

# 创建新对话
POST /api/conversations

# 获取对话详情（含消息）
GET /api/conversations/{id}

# 发送消息
POST /api/conversations/{id}/messages
Content-Type: application/json

{"message": "你好"}

# 更新对话标题
PATCH /api/conversations/{id}
Content-Type: application/json

{"title": "新标题"}

# 删除对话
DELETE /api/conversations/{id}
```

### 图书推荐接口（结构化输出示例）

```bash
# 获取主题相关书籍推荐
GET /books/{topic}

# 示例
curl http://localhost:8080/books/java
```

## ⚙️ 配置详解

### 完整配置示例

```yaml
spring:
  application:
    name: spring-ai-simple

  # AI 配置
  ai:
    anthropic:
      api-key: ${ANTHROPIC_API_KEY}  # 推荐使用环境变量
      base-url: https://api.anthropic.com
      chat:
        options:
          model: claude-sonnet-4-5-20250929

  # 数据库配置
  datasource:
    url: jdbc:h2:file:./data/chatdb;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
    username: sa
    password:
    hikari:
      minimum-idle: 5
      maximum-pool-size: 10
      connection-timeout: 30000

  # H2 控制台（开发环境）
  h2:
    console:
      enabled: true
      path: /h2-console

  # JPA 配置
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false

# 日志配置
logging:
  level:
    org.springframework.ai: DEBUG
```

### 支持的 Claude 模型

| 模型 | 说明 |
|------|------|
| `claude-sonnet-4-5-20250929` | Claude Sonnet 4.5（推荐） |
| `claude-opus-4-5` | Claude Opus 4.5 |
| `claude-haiku-4-5` | Claude Haiku 4.5 |
| `claude-3-5-sonnet-latest` | Claude 3.5 Sonnet |
| `claude-3-opus-latest` | Claude 3 Opus |

## ⚠️ 注意事项

### 1. API 密钥安全

```bash
# 推荐使用环境变量
export ANTHROPIC_API_KEY=your-api-key-here

# 或在 application.yaml 中引用
api-key: ${ANTHROPIC_API_KEY}
```

⚠️ **切勿将 API 密钥提交到版本控制系统！**

### 2. 代理服务配置

如果使用 API 代理服务，修改 `base-url`：

```yaml
spring:
  ai:
    anthropic:
      base-url: http://your-proxy-server:port
```

### 3. 数据库文件

- 数据库文件存储在 `./data/chatdb.mv.db`
- H2 控制台访问：http://localhost:8080/h2-console
- JDBC URL：`jdbc:h2:file:./data/chatdb`

### 4. 历史消息限制

为避免 Token 超限，系统默认只保留最近 20 条消息作为上下文。可在 `ConversationService.java` 中调整：

```java
int startIndex = Math.max(0, history.size() - 20); // 修改此数值
```

### 5. 结构化输出兼容性

Native Structured Output 需要模型支持，以下模型可用：
- Claude 3.5 Sonnet 及以上版本
- GPT-4o 及以上版本
- Gemini 1.5 Pro 及以上版本

旧版模型（如 `claude-3-haiku-20240307`）不支持此特性。

## 🔧 常见问题

### Q: 启动报错 "API key not found"

确保已正确配置 API 密钥，可通过环境变量或配置文件设置。

### Q: 模型不支持结构化输出

```
HTTP 400 - 'claude-3-haiku-20240307' does not support output format.
```

请切换到支持的模型版本（Claude 3.5 Sonnet 或更高）。

### Q: 连接超时

检查网络连接，如使用代理服务请确认 `base-url` 配置正确。

## 📄 许可证

MIT License

## 🔗 相关资源

- [Spring AI 官方文档](https://docs.spring.io/spring-ai/reference/)
- [Anthropic API 文档](https://docs.anthropic.com/)
- [Spring AI 结构化输出](https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html)
