document.addEventListener('DOMContentLoaded', () => {
    // 检查当前URL是否为TXT或MD文件，如果是则处理显示
    checkAndHandleTxtFile();
    checkAndHandleMdFile();
    
    const newsContainer = document.getElementById('news-container');
    
    // 如果不是TXT文件（即首页），则加载新闻文章
    if (newsContainer) {
        // 显示加载状态
        newsContainer.innerHTML = '<div class="loading">正在加载新闻...</div>';
        
        // 尝试加载不同编号的文章文件
        loadNewsArticles();
    }
});

async function loadNewsArticles() {
    const newsContainer = document.getElementById('news-container');
    const articles = [];
    
    // 尝试加载wz_1到wz_100的文件（可以根据需要调整范围）
    for (let i = 1; i <= 100; i++) {
        // 先尝试加载.html文件
        let filename = `wz_${i}.html`;
        let article = await tryLoadArticle(filename);
        
        // 如果.html文件不存在，尝试加载.md文件
        if (!article) {
            filename = `wz_${i}.md`;
            article = await tryLoadArticle(filename);
        }
        
        // 如果.md文件不存在，尝试加载.txt文件
        if (!article) {
            filename = `wz_${i}.txt`;
            article = await tryLoadArticle(filename);
        }
        
        if (article) {
            articles.push(article);
        }
    }
    
    // 按日期排序（最新的在前）
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 显示文章列表
    displayArticles(articles);
}

// 检查当前URL是否为TXT文件，如果是则处理显示
function checkAndHandleTxtFile() {
    const currentUrl = window.location.href;
    if (currentUrl.endsWith('.txt')) {
        // 获取文件名
        const filename = currentUrl.split('/').pop();
        
        // 如果是TXT文件，使用fetch获取内容并格式化显示
        fetch(filename)
            .then(response => {
                if (!response.ok) {
                    throw new Error('文件加载失败');
                }
                return response.text();
            })
            .then(content => {
                // 解析TXT内容并格式化显示
                formatAndDisplayTxtContent(content, filename);
            })
            .catch(error => {
                console.error('加载TXT文件时出错:', error);
            });
    }
}

// 格式化并显示TXT文件内容
function formatAndDisplayTxtContent(content, filename) {
    // 清空当前页面内容
    document.body.innerHTML = '';
    
    // 设置与首页一致的背景样式
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.fontFamily = 'Microsoft YaHei, sans-serif';
    document.body.style.lineHeight = '1.6';
    document.body.style.color = '#333';
    document.body.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%238baf69\" fill-opacity=\"0.4\" fill-rule=\"evenodd\"%3E%3Ccircle cx=\"3\" cy=\"3\" r=\"3\"/%3E%3Ccircle cx=\"13\" cy=\"13\" r=\"3\"/%3E%3C/g%3E%3C/svg%3E")';
    document.body.style.backgroundSize = '20px 20px';
    
    // 创建头部元素
    const header = document.createElement('header');
    header.innerHTML = `<img src="title.png" alt="我的世界新闻中心" class="title-image">`;
    document.body.appendChild(header);
    
    // 创建主内容区域
    const main = document.createElement('main');
    
    // 创建文章容器
    const articleContainer = document.createElement('div');
    articleContainer.className = 'news-article';
    
    // 解析TXT内容
    const lines = content.split('\n').map(line => line.trim());
    
    // 提取并添加标题
    if (lines.length > 0 && lines[0]) {
        const title = document.createElement('h2');
        title.textContent = lines[0];
        articleContainer.appendChild(title);
    }
    
    // 提取并添加日期
    if (lines.length > 1 && lines[1]) {
        const dateElement = document.createElement('div');
        dateElement.className = 'article-meta';
        
        // 尝试格式化日期
        let displayDate = lines[1];
        try {
            const dateMatch = lines[1].match(/\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
                const date = new Date(dateMatch[0]);
                displayDate = date.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        } catch (e) {
            console.error('日期格式化失败:', e);
        }
        
        dateElement.innerHTML = `<span class="article-date">发布日期：${displayDate}</span>`;
        articleContainer.appendChild(dateElement);
    }
    
    // 解析并添加文章内容（包含图片和视频）
    const contentElement = document.createElement('div');
    contentElement.className = 'article-content';
    
    // 从第三行开始解析内容
    let currentParagraph = '';
    for (let i = 2; i < lines.length; i++) {
        // 检查是否是图片标记
        if (lines[i].startsWith('[图片:')) {
            // 添加当前段落（如果有）
            if (currentParagraph.trim() !== '') {
                const p = document.createElement('p');
                p.textContent = currentParagraph.trim();
                contentElement.appendChild(p);
                currentParagraph = '';
            }
            
            // 提取图片URL并创建图片元素
            const imgMatch = lines[i].match(/\[图片:(.+)\]/);
            if (imgMatch && imgMatch[1]) {
                const image = document.createElement('img');
                image.src = imgMatch[1];
                image.alt = '文章图片';
                image.className = 'article-image';
                contentElement.appendChild(image);
            }
        }
        // 检查是否是视频标记
        else if (lines[i].startsWith('[视频:')) {
            // 添加当前段落（如果有）
            if (currentParagraph.trim() !== '') {
                const p = document.createElement('p');
                p.textContent = currentParagraph.trim();
                contentElement.appendChild(p);
                currentParagraph = '';
            }
            
            // 提取视频URL并创建视频元素
            const videoMatch = lines[i].match(/\[视频:(.+)\]/);
            if (videoMatch && videoMatch[1]) {
                const videoElement = document.createElement('video');
                videoElement.controls = true;
                
                // 设置视频类型
                const videoSrc = document.createElement('source');
                videoSrc.src = videoMatch[1];
                
                // 根据文件扩展名设置MIME类型
                const ext = videoMatch[1].split('.').pop().toLowerCase();
                if (ext === 'webm') {
                    videoSrc.type = 'video/webm';
                } else if (ext === 'ogg') {
                    videoSrc.type = 'video/ogg';
                } else {
                    videoSrc.type = 'video/mp4'; // 默认类型
                }
                
                videoElement.appendChild(videoSrc);
                videoElement.innerHTML += '您的浏览器不支持HTML5视频播放。';
                contentElement.appendChild(videoElement);
            }
        }
        // 如果是空行，结束当前段落并开始新段落
        else if (lines[i] === '') {
            if (currentParagraph.trim() !== '') {
                const p = document.createElement('p');
                p.textContent = currentParagraph.trim();
                contentElement.appendChild(p);
                currentParagraph = '';
            }
        }
        // 普通文本内容
        else {
            currentParagraph += (currentParagraph ? ' ' : '') + lines[i];
        }
    }
        
    // 添加最后一个段落（如果有）
    if (currentParagraph.trim() !== '') {
        const p = document.createElement('p');
        p.textContent = currentParagraph.trim();
        contentElement.appendChild(p);
    }
    
    articleContainer.appendChild(contentElement);
    
    // 添加返回首页链接
    const backLink = document.createElement('a');
    backLink.href = 'index.html';
    backLink.className = 'back-link';
    backLink.textContent = '返回首页';
    articleContainer.appendChild(backLink);
    
    // 将文章容器添加到主内容区域
    main.appendChild(articleContainer);
    document.body.appendChild(main);
    
    // 创建页脚元素
    const footer = document.createElement('footer');
    footer.innerHTML = `<div class="footer-content">
        <p>© 2023 我的世界新闻中心 版权所有</p>
        <div class="footer-links">
            <a href="index.html">首页</a>
            <a href="about.html">关于我们</a>
        </div>
    </div>`;
    document.body.appendChild(footer);
}

async function tryLoadArticle(filename) {
    try {
        // 尝试获取文件内容
        const response = await fetch(filename);
        
        // 如果文件不存在，返回null
        if (!response.ok) {
            return null;
        }
        
        const content = await response.text();
        
        // 检查文件扩展名，根据不同格式采用不同的解析方式
        if (filename.endsWith('.txt')) {
            // 解析TXT文件格式
            return parseTxtFile(filename, content);
        } else if (filename.endsWith('.md')) {
            // 解析Markdown文件格式
            return parseMdFile(filename, content);
        } else if (filename.endsWith('.html')) {
            // 解析HTML文件格式，支持视频
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            
            // 提取标题、摘要、日期、图片等信息
            const title = doc.querySelector('title')?.textContent || 
                          doc.querySelector('h1')?.textContent || 
                          `未命名文章 ${filename}`;
            
            // 尝试提取描述或摘要
            const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                                extractSummary(doc.body.textContent, 150);
            
            // 尝试提取日期
            const dateMeta = doc.querySelector('meta[name="date"]')?.getAttribute('content');
            const date = dateMeta || new Date().toISOString().split('T')[0];
            
            // 尝试提取图片（支持本地图片地址）
            let image = 'https://via.placeholder.com/300x200?text=News'; // 默认图片
            const firstImage = doc.querySelector('img');
            if (firstImage) {
                // 处理本地图片地址
                if (firstImage.src.startsWith('http')) {
                    image = firstImage.src;
                } else if (firstImage.getAttribute('src')) {
                    // 确保使用相对路径正确加载本地图片
                    image = firstImage.getAttribute('src');
                }
            }
            
            return {
                filename,
                title,
                description,
                date,
                image
            };
        }
    } catch (error) {
        console.log(`无法加载文件 ${filename}:`, error);
        return null;
    }
}

// 解析TXT文件格式的文章
function parseTxtFile(filename, content) {
    // TXT文件格式约定：
    // 第一行：标题
    // 第二行：日期（YYYY-MM-DD格式）
    // 第三行：分类（可选）
    // 第四行：图片路径（可选，支持本地图片路径）
    // 第五行及以后：文章内容
    
    const lines = content.split('\n').map(line => line.trim());
    
    // 提取标题
    let title = `未命名文章 ${filename}`;
    if (lines.length > 0 && lines[0]) {
        title = lines[0];
    }
    
    // 提取日期
    let date = new Date().toISOString().split('T')[0];
    if (lines.length > 1 && lines[1]) {
        // 尝试解析第二行为日期
        const dateMatch = lines[1].match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
            date = dateMatch[0];
        }
    }
    
    // 提取图片
    let image = 'https://via.placeholder.com/300x200?text=News'; // 默认图片
    if (lines.length > 2 && lines[2]) {
        image = lines[2];
    }
    
    // 提取描述（文章内容的前150个字符）
    let articleContent = '';
    if (lines.length > 3) {
        articleContent = lines.slice(3).join('\n');
    }
    const description = extractSummary(articleContent, 150);
    
    return {
        filename,
        title,
        description,
        date,
        image
    };
}

// 解析Markdown文件格式的文章
function parseMdFile(filename, content) {
    // Markdown文件格式约定：
    // 第一行：# 标题（支持一级标题格式）
    // 第二行：日期（YYYY-MM-DD格式）
    // 第三行：分类（可选，格式：category: 分类名称）
    // 第四行：图片路径（可选，支持本地图片路径，使用![alt](path)格式或直接路径）
    // 第五行及以后：文章内容
    
    const lines = content.split('\n').map(line => line.trim());
    
    // 提取标题
    let title = `未命名文章 ${filename}`;
    if (lines.length > 0) {
        // 检查是否是Markdown一级标题格式
        const titleMatch = lines[0].match(/^#\s+(.*)$/);
        if (titleMatch) {
            title = titleMatch[1];
        } else if (lines[0]) {
            title = lines[0];
        }
    }
    
    // 提取日期
    let date = new Date().toISOString().split('T')[0];
    if (lines.length > 1 && lines[1]) {
        // 尝试解析第二行为日期
        const dateMatch = lines[1].match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
            date = dateMatch[0];
        }
    }
    
    // 提取图片
    let image = 'https://via.placeholder.com/300x200?text=News'; // 默认图片
    if (lines.length > 2 && lines[2]) {
        // 检查是否是Markdown图片格式
        const imageMatch = lines[2].match(/^!\[.*?\]\((.*?)\)/);
        if (imageMatch) {
            image = imageMatch[1];
        } else {
            // 直接使用路径
            image = lines[2];
        }
    }
    
    // 提取描述（文章内容的前150个字符，去除Markdown格式标记）
    let articleContent = '';
    if (lines.length > 3) {
        // 从第四行开始提取内容
        articleContent = lines.slice(3).join('\n');
    }
    // 简单去除Markdown格式标记
    const plainText = articleContent.replace(/[#*_`~]|\[.*?\]\(.*?\)/g, '').trim();
    const description = extractSummary(plainText, 150);
    
    return {
        filename,
        title,
        description,
        date,
        image
    };
}

// 检查当前URL是否为MD文件，如果是则处理显示
function checkAndHandleMdFile() {
    const currentUrl = window.location.href;
    if (currentUrl.endsWith('.md')) {
        // 获取文件名
        const filename = currentUrl.split('/').pop();
        
        // 如果是MD文件，使用fetch获取内容并格式化显示
        fetch(filename)
            .then(response => {
                if (!response.ok) {
                    throw new Error('文件加载失败');
                }
                return response.text();
            })
            .then(content => {
                // 解析MD内容并格式化显示
                formatAndDisplayMdContent(content, filename);
            })
            .catch(error => {
                console.error('加载MD文件时出错:', error);
            });
    }
}

// 格式化并显示MD文件内容
function formatAndDisplayMdContent(content, filename) {
    // 清空当前页面内容
    document.body.innerHTML = '';
    
    // 创建基本的HTML结构，与index.html保持一致
    document.body.className = ''; // 重置body类名
    document.body.style.backgroundColor = '#8baf69';
    document.body.style.backgroundImage = `
        linear-gradient(45deg, #8baf69 25%, transparent 25%),
        linear-gradient(-45deg, #8baf69 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #8baf69 75%),
        linear-gradient(-45deg, transparent 75%, #8baf69 75%)
    `;
    document.body.style.backgroundSize = '20px 20px';
    document.body.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // 创建头部元素
    const header = document.createElement('header');
    header.innerHTML = `<img src="title.png" alt="我的世界新闻中心" class="title-image">`;
    document.body.appendChild(header);
    
    // 创建主内容区域
    const main = document.createElement('main');
    
    // 创建文章容器
    const articleContainer = document.createElement('div');
    articleContainer.className = 'news-article';
    
    // 解析MD内容
    const lines = content.split('\n').map(line => line.trim());
    
    // 提取并添加标题
    if (lines.length > 0 && lines[0]) {
        const title = document.createElement('h2');
        // 移除可能的Markdown标题标记
        const cleanTitle = lines[0].replace(/^#\s+/, '');
        title.textContent = cleanTitle;
        articleContainer.appendChild(title);
    }
    
    // 提取并添加日期
    if (lines.length > 1 && lines[1]) {
        const dateElement = document.createElement('div');
        dateElement.className = 'article-date';
        
        // 尝试格式化日期
        let displayDate = lines[1];
        try {
            const dateMatch = lines[1].match(/\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
                const date = new Date(dateMatch[0]);
                displayDate = date.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        } catch (e) {
            console.error('日期格式化失败:', e);
        }
        
        dateElement.textContent = '发布日期：' + displayDate;
        articleContainer.appendChild(dateElement);
    }
    
    // 提取并添加图片
    if (lines.length > 2 && lines[2]) {
        const image = document.createElement('img');
        // 检查是否是Markdown图片格式
        const imageMatch = lines[2].match(/^!\[.*?\]\((.*?)\)/);
        if (imageMatch) {
            image.src = imageMatch[1];
        } else {
            image.src = lines[2];
        }
        image.alt = '文章图片';
        image.className = 'article-image';
        articleContainer.appendChild(image);
    }
    
    // 提取并添加文章内容
    if (lines.length > 3) {
        const contentElement = document.createElement('div');
        contentElement.className = 'article-content';
        
        // 简单转换Markdown格式为HTML
        let htmlContent = '';
        for (let i = 3; i < lines.length; i++) {
            let line = lines[i];
            
            // 处理标题
            if (line.startsWith('## ')) {
                htmlContent += `<h2>${line.substring(3)}</h2>`;
            } else if (line.startsWith('# ')) {
                htmlContent += `<h1>${line.substring(2)}</h1>`;
            }
            // 处理列表
            else if (line.startsWith('- ') || line.startsWith('* ')) {
                htmlContent += `<ul><li>${line.substring(2)}</li></ul>`;
            }
            // 处理引用
            else if (line.startsWith('> ')) {
                htmlContent += `<blockquote>${line.substring(2)}</blockquote>`;
            }
            // 处理代码块
            else if (line.startsWith('```')) {
                let codeBlock = '';
                i++;
                while (i < lines.length && !lines[i].startsWith('```')) {
                    codeBlock += lines[i] + '\n';
                    i++;
                }
                htmlContent += `<pre><code>${codeBlock}</code></pre>`;
            }
            // 处理普通段落
            else if (line === '') {
                htmlContent += '<br>';
            } else {
                htmlContent += `<p>${line}</p>`;
            }
        }
        
        contentElement.innerHTML = htmlContent;
        articleContainer.appendChild(contentElement);
    }
    
    // 添加返回首页链接
    const backLink = document.createElement('a');
    backLink.href = 'index.html';
    backLink.className = 'back-link';
    backLink.textContent = '返回首页';
    articleContainer.appendChild(backLink);
    
    // 将文章容器添加到主内容区域
    main.appendChild(articleContainer);
    document.body.appendChild(main);
    
    // 创建页脚元素
    const footer = document.createElement('footer');
    footer.innerHTML = `<div class="footer-content">
        <p>© 2023 我的世界新闻中心 版权所有</p>
        <div class="footer-links">
            <a href="index.html">首页</a>
            <a href="about.html">关于我们</a>
        </div>
    </div>`;
    document.body.appendChild(footer);
}

// 从文本中提取摘要
function extractSummary(text, maxLength) {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    return cleanedText.length > maxLength 
        ? cleanedText.substring(0, maxLength) + '...' 
        : cleanedText;
}

// 存储文章数据
let allArticles = [];

// 显示文章列表
function displayArticles(articles) {
    const newsContainer = document.getElementById('news-container');
    
    if (articles.length === 0) {
        newsContainer.innerHTML = '<div class="no-news">暂无新闻文章</div>';
        return;
    }
    
    // 存储所有文章数据
    allArticles = articles;
    
    // 清空容器
    newsContainer.innerHTML = '';
    
    // 创建文章卡片
    articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'news-card';
        
        // 格式化日期显示
        const formattedDate = formatDate(article.date);
        
        card.innerHTML = `
            <img src="${article.image}" alt="${article.title}">
            <div class="news-content">
                <h3>${article.title}</h3>
                <p>${article.description}</p>
                <span class="news-date">发布日期：${formattedDate}</span>
                <a href="${article.filename}" class="read-more">阅读全文</a>
            </div>
        `;
        
        newsContainer.appendChild(card);
        
        // 为.md文件添加特殊的点击事件处理
        if (article.filename.endsWith('.md')) {
            const readMoreLink = card.querySelector('.read-more');
            readMoreLink.addEventListener('click', function(e) {
                e.preventDefault(); // 阻止默认行为（下载文件）
                
                // 获取文件名
                const filename = article.filename;
                
                // 使用fetch获取内容并格式化显示
                fetch(filename)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('文件加载失败');
                        }
                        return response.text();
                    })
                    .then(content => {
                        // 解析MD内容并格式化显示
                        formatAndDisplayMdContent(content, filename);
                    })
                    .catch(error => {
                        console.error('加载MD文件时出错:', error);
                    });
            });
        }
    });
    
}


// 格式化日期
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}