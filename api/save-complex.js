// /api/save-complex.js
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { complexName } = req.body;

    // 단지명 검증
    if (!complexName || complexName.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: '단지명이 필요합니다.' 
      });
    }

    // Notion Database에 단지명만 저장
    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties: {
        '단지명': {
          title: [
            {
              text: {
                content: complexName.trim(),
              },
            },
          ],
        },
        '조회일시': {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });

    console.log('✅ Notion에 단지명 저장 성공:', complexName);

    res.status(200).json({
      success: true,
      message: '단지명이 성공적으로 저장되었습니다.',
      complexName: complexName,
      notionPageId: response.id,
    });

  } catch (error) {
    console.error('❌ Notion 저장 오류:', error);
    
    res.status(500).json({
      success: false,
      message: '저장 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : '서버 오류',
    });
  }
}
