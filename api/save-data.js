export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { Client } = require('@notionhq/client');
  
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });

  try {
    const { 
      complexName, 
      kbPrice, 
      deposit, 
      loan, 
      result 
    } = req.body;

    await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
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
                content: kbPrice,
              },
            },
          ],
        },
        '보증금': {
          rich_text: [
            {
              text: {
                content: deposit,
              },
            },
          ],
        },
        '융자금': {
          rich_text: [
            {
              text: {
                content: loan,
              },
            },
          ],
        },
        '결과': {
          select: {
            name: result,
          },
        },
        '조회일시': {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
}
