// 全局状态
let currentConversationId = null;
let conversations = [];

// DOM 元素
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const chatHistory = document.getElementById('chatHistory');

// 初始化
window.addEventListener('load', async function() {
    await loadConversations();
    userInput.focus();
    updateSendButtonState();
});

// 自动调整输入框高度并更新按钮状态
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    updateSendButtonState();
});

// 更新发送按钮状态
function updateSendButtonState() {
    const hasContent = userInput.value.trim().length > 0;
    sendButton.disabled = !hasContent;
}

// 监听回车键发送消息
userInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (userInput.value.trim()) {
            sendMessage();
        }
    }
});

// 加载对话列表
async function loadConversations() {
    try {
        const response = await fetch('/api/conversations');
        conversations = await response.json();
        renderConversationList();
    } catch (error) {
        console.error('Failed to load conversations:', error);
    }
}

// 渲染对话列表
function renderConversationList() {
    // 按日期分组
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups = {
        today: [],
        yesterday: [],
        lastWeek: [],
        older: []
    };

    conversations.forEach(conv => {
        const updatedAt = new Date(conv.updatedAt);
        if (updatedAt >= today) {
            groups.today.push(conv);
        } else if (updatedAt >= yesterday) {
            groups.yesterday.push(conv);
        } else if (updatedAt >= lastWeek) {
            groups.lastWeek.push(conv);
        } else {
            groups.older.push(conv);
        }
    });

    let html = '';

    if (groups.today.length > 0) {
        html += renderGroup('今天', groups.today);
    }
    if (groups.yesterday.length > 0) {
        html += renderGroup('昨天', groups.yesterday);
    }
    if (groups.lastWeek.length > 0) {
        html += renderGroup('最近7天', groups.lastWeek);
    }
    if (groups.older.length > 0) {
        html += renderGroup('更早', groups.older);
    }

    if (html === '') {
        html = '<div class="no-conversations">暂无对话记录</div>';
    }

    chatHistory.innerHTML = html;
}

function renderGroup(title, items) {
    let html = `<div class="history-section">
        <div class="history-title">${title}</div>`;

    items.forEach(conv => {
        const isActive = conv.id === currentConversationId ? 'active' : '';
        html += `
            <div class="history-item ${isActive}" onclick="selectConversation('${conv.id}')" data-id="${conv.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="history-item-title">${escapeHtml(conv.title)}</span>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteConversation('${conv.id}')" title="删除对话">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>`;
    });

    html += '</div>';
    return html;
}

// 选择对话
async function selectConversation(id) {
    currentConversationId = id;

    // 更新侧边栏选中状态
    document.querySelectorAll('.history-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === id) {
            item.classList.add('active');
        }
    });

    // 加载对话消息
    try {
        const response = await fetch(`/api/conversations/${id}`);
        const conversation = await response.json();

        // 清空聊天区域
        chatContainer.innerHTML = '';

        // 渲染消息
        if (conversation.messages && conversation.messages.length > 0) {
            conversation.messages.forEach(msg => {
                addMessageToUI(msg.content, msg.role);
            });
        } else {
            showWelcomeScreen();
        }
    } catch (error) {
        console.error('Failed to load conversation:', error);
    }
}

// 切换侧边栏
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
}

// 新建对话
async function newChat() {
    try {
        const response = await fetch('/api/conversations', {
            method: 'POST'
        });
        const conversation = await response.json();

        currentConversationId = conversation.id;
        conversations.unshift(conversation);
        renderConversationList();

        // 显示欢迎屏幕
        showWelcomeScreen();

        userInput.value = '';
        userInput.style.height = 'auto';
        userInput.focus();
    } catch (error) {
        console.error('Failed to create conversation:', error);
    }
}

// 删除对话
async function deleteConversation(id) {
    if (!confirm('确定要删除这个对话吗？')) {
        return;
    }

    try {
        await fetch(`/api/conversations/${id}`, {
            method: 'DELETE'
        });

        // 从列表中移除
        conversations = conversations.filter(c => c.id !== id);
        renderConversationList();

        // 如果删除的是当前对话，显示欢迎屏幕
        if (id === currentConversationId) {
            currentConversationId = null;
            showWelcomeScreen();
        }
    } catch (error) {
        console.error('Failed to delete conversation:', error);
    }
}

// 显示欢迎屏幕
function showWelcomeScreen() {
    chatContainer.innerHTML = `
        <div class="welcome-screen" id="welcomeScreen">
            <div class="welcome-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
            </div>
            <h2>有什么可以帮您？</h2>
            <div class="quick-actions">
                <button class="quick-btn" onclick="sendQuickMessage('推荐几本学习 Java 的书籍')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    推荐 Java 书籍
                </button>
                <button class="quick-btn" onclick="sendQuickMessage('解释一下 Spring Boot 的自动配置原理')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Spring Boot 原理
                </button>
                <button class="quick-btn" onclick="sendQuickMessage('写一个简单的 REST API 示例')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                    REST API 示例
                </button>
            </div>
        </div>
    `;
}

// 快捷消息
function sendQuickMessage(message) {
    userInput.value = message;
    sendMessage();
}

// 发送消息函数
async function sendMessage() {
    const message = userInput.value.trim();

    if (!message) {
        return;
    }

    // 如果没有当前对话，先创建一个
    if (!currentConversationId) {
        try {
            const response = await fetch('/api/conversations', {
                method: 'POST'
            });
            const conversation = await response.json();
            currentConversationId = conversation.id;
            conversations.unshift(conversation);
            renderConversationList();
        } catch (error) {
            console.error('Failed to create conversation:', error);
            return;
        }
    }

    // 禁用输入和按钮
    setLoading(true);

    // 移除欢迎屏幕
    const welcome = document.getElementById('welcomeScreen');
    if (welcome) {
        welcome.remove();
    }

    // 显示用户消息
    addMessageToUI(message, 'user');

    // 清空输入框
    userInput.value = '';
    userInput.style.height = 'auto';

    // 显示打字指示器
    const typingId = showTypingIndicator();

    try {
        // 发送请求到后端
        const response = await fetch(`/api/conversations/${currentConversationId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 移除打字指示器
        removeTypingIndicator(typingId);

        // 显示助手回复
        addMessageToUI(data.content, 'assistant');

        // 更新对话列表中的标题
        await loadConversations();

    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator(typingId);
        addMessageToUI('抱歉，发生了错误。请稍后再试。', 'assistant');
    } finally {
        setLoading(false);
        userInput.focus();
    }
}

// 添加消息到 UI
function addMessageToUI(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'message-wrapper';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.textContent = sender === 'user' ? 'U' : 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formatMessage(text);

    wrapperDiv.appendChild(avatarDiv);
    wrapperDiv.appendChild(contentDiv);
    messageDiv.appendChild(wrapperDiv);
    chatContainer.appendChild(messageDiv);

    // 代码高亮
    highlightCode(contentDiv);

    // 滚动到底部
    scrollToBottom();
}

// 代码高亮函数
function highlightCode(container) {
    if (typeof hljs !== 'undefined') {
        container.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
}

// 格式化消息文本 - 支持 Markdown
function formatMessage(text) {
    if (!text) return '';

    // 保存代码块，避免被其他规则处理（使用不含特殊字符的占位符）
    const codeBlocks = [];
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, function(match, lang, code) {
        const index = codeBlocks.length;
        codeBlocks.push({ lang: lang, code: code.trim() });
        return `\x00CODEBLOCK${index}\x00`;
    });

    // 保存行内代码
    const inlineCodes = [];
    text = text.replace(/`([^`]+)`/g, function(match, code) {
        const index = inlineCodes.length;
        inlineCodes.push(code);
        return `\x00INLINECODE${index}\x00`;
    });

    // 处理表格（在转义 HTML 之前）
    const tables = [];
    text = text.replace(/(?:^|\n)((?:\|[^\n]+\|\n)+)/g, function(match, tableContent) {
        const lines = tableContent.trim().split('\n');
        if (lines.length < 2) return match;

        // 检查是否有分隔行（第二行应该是 |---|---|...）
        const separatorLine = lines[1];
        if (!/^\|[\s\-:|]+\|$/.test(separatorLine)) return match;

        let html = '<table>';

        // 处理表头
        const headerCells = lines[0].split('|').filter((cell, i, arr) => i > 0 && i < arr.length - 1);
        html += '<thead><tr>';
        headerCells.forEach(cell => {
            html += `<th>${cell.trim()}</th>`;
        });
        html += '</tr></thead>';

        // 处理表体
        html += '<tbody>';
        for (let i = 2; i < lines.length; i++) {
            const cells = lines[i].split('|').filter((cell, idx, arr) => idx > 0 && idx < arr.length - 1);
            html += '<tr>';
            cells.forEach(cell => {
                html += `<td>${cell.trim()}</td>`;
            });
            html += '</tr>';
        }
        html += '</tbody></table>';

        const index = tables.length;
        tables.push(html);
        return `\n\x00TABLE${index}\x00\n`;
    });

    // 转义 HTML
    text = text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    // 处理标题 (h1-h6)
    text = text.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    text = text.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    text = text.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // 处理粗体和斜体（注意顺序：先处理组合，再处理单独的）
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // 下划线斜体需要更严格的匹配，避免匹配文件名等
    text = text.replace(/(?<![a-zA-Z0-9])_([^_\s][^_]*[^_\s])_(?![a-zA-Z0-9])/g, '<em>$1</em>');

    // 处理删除线
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // 处理无序列表
    text = text.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');

    // 处理有序列表
    text = text.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // 将连续的 li 包装在 ul 中
    text = text.replace(/(<li>[\s\S]*?<\/li>)(\s*<li>[\s\S]*?<\/li>)*/g, function(match) {
        return '<ul>' + match + '</ul>';
    });

    // 处理引用块
    text = text.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    // 合并连续的 blockquote
    text = text.replace(/<\/blockquote>\s*<blockquote>/g, '<br>');

    // 处理水平线
    text = text.replace(/^---+$/gm, '<hr>');
    text = text.replace(/^\*\*\*+$/gm, '<hr>');

    // 处理链接
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // 处理换行
    text = text.replace(/\n\n+/g, '</p><p>');
    text = text.replace(/\n/g, '<br>');

    // 包装在段落中
    if (!text.startsWith('<h') && !text.startsWith('<ul') && !text.startsWith('<blockquote') && !text.startsWith('<hr')) {
        text = '<p>' + text + '</p>';
    }

    // 清理空段落和多余的标签
    text = text.replace(/<p><\/p>/g, '');
    text = text.replace(/<p>(<h\d>)/g, '$1');
    text = text.replace(/(<\/h\d>)<\/p>/g, '$1');
    text = text.replace(/<p>(<ul>)/g, '$1');
    text = text.replace(/(<\/ul>)<\/p>/g, '$1');
    text = text.replace(/<p>(<blockquote>)/g, '$1');
    text = text.replace(/(<\/blockquote>)<\/p>/g, '$1');
    text = text.replace(/<p>(<hr>)/g, '$1');
    text = text.replace(/(<hr>)<\/p>/g, '$1');
    text = text.replace(/<p><br>/g, '<p>');
    text = text.replace(/<br><\/p>/g, '</p>');

    // 恢复表格
    tables.forEach((table, index) => {
        text = text.replace(new RegExp(`<br>?\x00TABLE${index}\x00<br>?`, 'g'), table);
        text = text.replace(`\x00TABLE${index}\x00`, table);
    });

    // 恢复代码块
    codeBlocks.forEach((block, index) => {
        const langClass = block.lang ? ` class="language-${block.lang}"` : '';
        const escapedCode = block.code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        text = text.replace(`\x00CODEBLOCK${index}\x00`, `</p><pre><code${langClass}>${escapedCode}</code></pre><p>`);
    });

    // 恢复行内代码
    inlineCodes.forEach((code, index) => {
        const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        text = text.replace(`\x00INLINECODE${index}\x00`, `<code>${escapedCode}</code>`);
    });

    // 最终清理
    text = text.replace(/<p><\/p>/g, '');
    text = text.replace(/<p>\s*<\/p>/g, '');
    text = text.replace(/<p>(<table>)/g, '$1');
    text = text.replace(/(<\/table>)<\/p>/g, '$1');

    return text;
}

// 显示打字指示器
function showTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = 'typing-indicator-' + Date.now();

    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'message-wrapper';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.textContent = 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';

    contentDiv.appendChild(typingIndicator);
    wrapperDiv.appendChild(avatarDiv);
    wrapperDiv.appendChild(contentDiv);
    messageDiv.appendChild(wrapperDiv);
    chatContainer.appendChild(messageDiv);

    scrollToBottom();

    return messageDiv.id;
}

// 移除打字指示器
function removeTypingIndicator(id) {
    const typingDiv = document.getElementById(id);
    if (typingDiv) {
        typingDiv.remove();
    }
}

// 设置加载状态
function setLoading(loading) {
    sendButton.disabled = loading;
    userInput.disabled = loading;
}

// 滚动到底部
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
