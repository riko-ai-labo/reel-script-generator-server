document.addEventListener('DOMContentLoaded', () => {
  const articleContentEl = document.getElementById('article-content');
  const generateBtn = document.getElementById('generate-btn');
  const loadingEl = document.getElementById('loading');
  const scriptContainerEl = document.getElementById('script-container');
  const framesContainerEl = document.getElementById('frames-container');
  const copyBtn = document.getElementById('copy-btn');
  const errorMessageEl = document.getElementById('error-message');
  
  // GitHubのシークレットモードで設定されたAPIキーを使用する想定
  // 実際のデプロイ時にはGitHubのシークレットから環境変数として取得
  
  // 生成ボタンのクリックイベント
  generateBtn.addEventListener('click', async () => {
    const content = articleContentEl.value.trim();
    
    if (!content) {
      showError('記事内容を入力してください');
      return;
    }
    
    // UI状態の更新
    generateBtn.disabled = true;
    loadingEl.classList.add('active');
    scriptContainerEl.classList.remove('active');
    errorMessageEl.classList.remove('active');
    
    try {
      // APIキーは環境変数から取得する想定（GitHubのシークレットモードで設定）
      const reelScript = await generateReelScript(content);
      displayScript(reelScript);
    } catch (error) {
      showError(error.message || 'エラーが発生しました。もう一度お試しください');
      console.error('Error:', error);
    } finally {
      generateBtn.disabled = false;
      loadingEl.classList.remove('active');
    }
  });
  
  // Gemini APIを使用してリール台本を生成する関数
  async function generateReelScript(pageContent) {
    // サーバーサイドのAPIにリクエストを送信
    // APIキーはサーバー側で管理される想定
    try {
      // サーバーサイドのAPIエンドポイントにリクエストを送信
      // APIキーはサーバー側でGitHubシークレットから取得される想定
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pageContent })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'APIリクエストに失敗しました');
      }

      const data = await response.json();
      return data.reelScript;
    } catch (error) {
      console.error('サーバーエラー:', error);
      throw new Error('サーバーとの通信に失敗しました');
    }
    

  }
  
  // 台本表示関数
  function displayScript(reelScript) {
    framesContainerEl.innerHTML = '';
    
    if (reelScript && reelScript.frames && reelScript.frames.length > 0) {
      reelScript.frames.forEach((frame, index) => {
        const frameEl = document.createElement('div');
        frameEl.className = 'frame';
        
        const frameNumberEl = document.createElement('div');
        frameNumberEl.className = 'frame-number';
        frameNumberEl.textContent = index + 1;
        
        const narrationEl = document.createElement('p');
        narrationEl.textContent = frame.narration;
        
        frameEl.appendChild(frameNumberEl);
        frameEl.appendChild(narrationEl);
        framesContainerEl.appendChild(frameEl);
      });
      
      scriptContainerEl.classList.add('active');
    } else {
      showError('台本の生成に失敗しました。もう一度お試しください');
    }
  }
  
  // コピーボタンのクリックイベント
  copyBtn.addEventListener('click', () => {
    const frames = document.querySelectorAll('.frame p');
    let fullScript = '';
    
    frames.forEach((frame, index) => {
      fullScript += `${index + 1}. ${frame.textContent}\n`;
    });
    
    navigator.clipboard.writeText(fullScript)
      .then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'コピーしました！';
        
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('クリップボードへのコピーに失敗しました:', err);
      });
  });
  
  // エラー表示関数
  function showError(message, type = 'error') {
    errorMessageEl.textContent = message;
    errorMessageEl.classList.add('active');
    
    if (type === 'success') {
      errorMessageEl.style.backgroundColor = '#d4edda';
      errorMessageEl.style.color = '#155724';
      errorMessageEl.style.borderColor = '#c3e6cb';
      
      // 3秒後に非表示にする
      setTimeout(() => {
        errorMessageEl.classList.remove('active');
        // スタイルをリセット
        errorMessageEl.style.backgroundColor = '';
        errorMessageEl.style.color = '';
        errorMessageEl.style.borderColor = '';
      }, 3000);
    } else {
      errorMessageEl.style.backgroundColor = '';
      errorMessageEl.style.color = '';
      errorMessageEl.style.borderColor = '';
    }
  }
});
