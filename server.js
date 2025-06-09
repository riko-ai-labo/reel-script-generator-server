const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS設定
app.use(cors());

// JSONリクエストの解析
app.use(express.json());

// 静的ファイルの提供
app.use(express.static(path.join(__dirname)));

// APIエンドポイント
app.post('/api/generate-script', async (req, res) => {
  try {
    const { pageContent } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'APIキーが設定されていません' });
    }
    
    const prompt = `あなたは30秒のリール動画用の台本を作成するエキスパートです。以下のウェブページの内容を元に、30秒のリール台本を作成してください。

${pageContent}

台本の構成:
1. 強いフック（視聴者の注目を集める）
2. 問題提起
3. 解決策の提示
4. 具体例や理由（3つ程度）
5. まとめ

台本は15フレーム（各2秒）で構成し、各フレームのナレーション（最大10文字程度）を書いてください。ナレーションはそのまま字幕としても使用されます。

出力形式:
{
  "frames": [
    {
      "narration": "ナレーション1"
    },
    {
      "narration": "ナレーション2"
    }
    // 残りのフレーム
  ]
}`;
    
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        }
      }
    );
    
    const generatedText = response.data.candidates[0].content.parts[0].text;
    let reelScript;
    
    try {
      // JSON部分を抽出して解析
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/m);
      if (jsonMatch) {
        reelScript = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSONフォーマットが見つかりませんでした');
      }
    } catch (parseError) {
      console.error('JSON解析エラー:', parseError);
      // フォールバック：テキスト全体を返す
      reelScript = { frames: [{ narration: generatedText }] };
    }
    
    res.json({ reelScript });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ error: error.message || 'サーバーエラーが発生しました' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
