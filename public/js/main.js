// 下载相关功能
async function downloadMusic(ids, level) {
    try {
        const response = await fetch(`http://localhost:15001/Song_V1?ids=${encodeURIComponent(ids)}&level=${level}&type=down`);
        if (!response.ok) throw new Error('下载失败');

        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'download.mp3';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/i);
            if (filenameMatch && filenameMatch[1]) {
                filename = decodeURIComponent(filenameMatch[1]);
            }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('下载出错:', error);
        alert('下载失败，请重试');
    }
}

function selectAll() {
    document.querySelectorAll('.song-checkbox').forEach(checkbox => checkbox.checked = true);
}

function deselectAll() {
    document.querySelectorAll('.song-checkbox').forEach(checkbox => checkbox.checked = false);
}

async function batchDownload(level) {
    const selectedIds = Array.from(document.querySelectorAll('.song-checkbox:checked')).map(cb => cb.value);
    if (selectedIds.length === 0) {
        alert('请至少选择一首歌曲');
        return;
    }

    try {
        const response = await fetch(`http://localhost:15001/Song_V1?type=batchDown&level=${level}&selectedIds=${JSON.stringify(selectedIds)}`);
        if (!response.ok) throw new Error('下载失败');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'songs.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('批量下载出错:', error);
        alert('下载失败，请重试');
    }
}

// 初始化表单处理
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('musicForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const ids = document.getElementById('ids').value;
        const level = document.getElementById('level').value;
        const resultDiv = document.getElementById('result');

        try {
            const response = await fetch(`http://localhost:15001/Song_V1?ids=${encodeURIComponent(ids)}&level=${level}&type=json`);
            const data = await response.json();

            if (data.status === 200) {
                resultDiv.style.display = 'block';
                
                if (data.songs) {
                    resultDiv.innerHTML = `
                        <div style="margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                            <div style="display: flex; gap: 10px;">
                                <button onclick="selectAll()" class="download-btn">全选</button>
                                <button onclick="deselectAll()" class="download-btn">取消全选</button>
                            </div>
                            <button onclick="batchDownload('${level}')" class="download-btn">批量下载所选</button>
                        </div>
                        <div id="songList">
                            ${data.songs.map(song => `
                                <div class="card">
                                    <input type="checkbox" class="song-checkbox" value="${song.id}" style="margin-right: 8px;">
                                    <img src="${song.pic}" alt="专辑封面">
                                    <div class="card-content">
                                        <h3>${song.name}</h3>
                                        <p>歌手：${song.ar_name}</p>
                                        <p>专辑：${song.al_name}</p>
                                        <p>音质：${song.level} | 大小：${song.size}</p>
                                        <div class="card-actions">
                                            <button onclick="downloadMusic('${song.id}', '${level}')" class="download-btn">下载音乐</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>`;
                } else {
                    resultDiv.innerHTML = `
                        <div class="card">
                            <img src="${data.pic}" alt="专辑封面">
                            <div class="card-content">
                                <h3>${data.name}</h3>
                                <p>歌曲ID：${data.id}</p>
                                <p>歌手：${data.ar_name}</p>
                                <p>专辑：${data.al_name}</p>
                                <p>音质：${data.level} | 大小：${data.size}</p>
                                <div class="card-actions">
                                    <button onclick="downloadMusic('${data.id}', '${level}')" class="download-btn">下载音乐</button>
                                </div>
                            </div>
                        </div>
                    `;
                }
            } else {
                resultDiv.innerHTML = `<p style="color: red;">获取信息失败：${data.msg || '未知错误'}</p>`;
            }
        } catch (error) {
            resultDiv.innerHTML = `<p style="color: red;">请求失败：${error.message}</p>`;
        }
    });
});