// /api/save-complex.js
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export default async function handler(req, res) {
  console.log('🚀 API 호출됨:', req.method);
  
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS 요청 처리됨');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ 잘못된 메서드:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('📝 요청 본문:', req.body);
    
    // 환경변수 확인
    if (!process.env.NOTION_TOKEN) {
      console.error('❌ NOTION_TOKEN 환경변수가 설정되지 않음');
      return res.status(500).json({ 
        success: false, 
        message: 'Notion Token이 설정되지 않았습니다.' 
      });
    }
    
    if (!process.env.NOTION_DATABASE_ID) {
      console.error('❌ NOTION_DATABASE_ID 환경변수가 설정되지 않음');
      return res.status(500).json({ 
        success: false, 
        message: 'Database ID가 설정되지 않았습니다.' 
      });
    }
    
    const { complexName } = req.body;
    console.log('🏢 받은 단지명:', complexName);

    // 단지명 검증
    if (!complexName || complexName.trim() === '') {
      console.log('❌ 단지명이 비어있음');
      return res.status(400).json({ 
        success: false, 
        message: '단지명이 필요합니다.' 
      });
    }

    console.log('📤 Notion에 저장 시도 중...');
    console.log('🔑 Database ID:', process.env.NOTION_DATABASE_ID);

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
    console.log('📄 생성된 페이지 ID:', response.id);

    res.status(200).json({
      success: true,
      message: '단지명이 성공적으로 저장되었습니다.',
      complexName: complexName,
      notionPageId: response.id,
    });

  } catch (error) {
    console.error('❌ Notion 저장 오류:', error);
    console.error('오류 상세:', error.message);
    console.error('오류 스택:', error.stack);
    
    res.status(500).json({
      success: false,
      message: '저장 중 오류가 발생했습니다.',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
