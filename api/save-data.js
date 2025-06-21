import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  // CORS 헤더 설정 (Vercel 환경에 맞게)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS 요청 처리 (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 환경변수 확인
  const notionApiKey = process.env.NOTION_API_KEY;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!notionApiKey || !notionDatabaseId) {
    console.error('Missing environment variables:', {
      hasApiKey: !!notionApiKey,
      hasDatabaseId: !!notionDatabaseId
    });
    return res.status(500).json({ 
      error: 'Missing Notion configuration',
      details: 'API key or database ID not configured'
    });
  }

  const notion = new Client({
    auth: notionApiKey,
  });

  try {
    const { 
      complexName, 
      kbPrice, 
      deposit, 
      loan, 
      result 
    } = req.body;

    // 필수 데이터 검증
    if (!complexName || !kbPrice) {
      return res.status(400).json({ 
        error: 'Missing required data',
        details: 'complexName and kbPrice are required'
      });
    }

    console.log('📝 Notion에 저장할 데이터:', {
      complexName,
      kbPrice,
      deposit,
      loan,
      result,
      databaseId: notionDatabaseId
    });

    const response = await notion.pages.create({
      parent: {
        database_id: notionDatabaseId,
      },
      properties: {
        '단지명': {
          title: [
            {
              text: {
                content: complexName,
              },
            },
          ],
        },
        'KB시세': {
          rich_text: [
            {
              text: {
                content: kbPrice.toString(),
              },
            },
          ],
        },
        '보증금': {
          rich_text: [
            {
              text: {
                content: deposit ? deposit.toString() : '-',
              },
            },
          ],
        },
        '융자금': {
          rich_text: [
            {
              text: {
                content: loan ? loan.toString() : '-',
              },
            },
          ],
        },
        '결과': {
          select: {
            name: result || '조회완료',
          },
        },
        '조회일시': {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });

    console.log('✅ Notion 저장 성공:', response.id);
    res.status(200).json({ 
      success: true, 
      pageId: response.id,
      message: 'Data saved to Notion successfully'
    });
  } catch (error) {
    console.error('❌ Notion API Error:', error);
    
    // 에러 타입별 상세 메시지
    let errorMessage = 'Failed to save data to Notion';
    let errorDetails = error.message;

    if (error.code === 'unauthorized') {
      errorMessage = 'Notion API key is invalid';
    } else if (error.code === 'object_not_found') {
      errorMessage = 'Notion database not found';
    } else if (error.code === 'validation_error') {
      errorMessage = 'Invalid data format';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      code: error.code
    });
  }
}
