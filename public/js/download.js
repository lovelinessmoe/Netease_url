function downloadWithProgress(url) {
    const eventSource = new EventSource(url);
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    document.body.appendChild(progressBar);

    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        switch(data.status) {
            case 'start':
                progressBar.innerHTML = `开始下载: ${data.fileName}`;
                break;
            case 'downloading':
                progressBar.innerHTML = `下载中: ${data.progress}%`;
                progressBar.style.width = `${data.progress}%`;
                break;
            case 'processing':
                progressBar.innerHTML = '处理中...';
                break;
            case 'complete':
                progressBar.innerHTML = '下载完成！';
                eventSource.close();
                setTimeout(() => progressBar.remove(), 3000);
                break;
            case 'error':
                progressBar.innerHTML = `错误: ${data.message}`;
                eventSource.close();
                setTimeout(() => progressBar.remove(), 3000);
                break;
        }
    };

    eventSource.onerror = function() {
        progressBar.innerHTML = '下载出错';
        eventSource.close();
        setTimeout(() => progressBar.remove(), 3000);
    };
}