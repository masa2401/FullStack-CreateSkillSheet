import type { Page } from '@playwright/test'

type PdfStatusBody = { status: 'generating' } | { status: 'ready'; downloadUrl: string }
type SharedSheetScenario = 'success' | 'expired' | 'notfound'

/** POST /api/sheets を任意のIDで応答するようモックする */
export const mockSaveSheet = async (page: Page, id: string): Promise<void> => {
  await page.route('**/api/sheets', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id }),
      })
    } else {
      await route.continue()
    }
  })
}

/** GET /api/pdf/:id/status を呼び出し順に異なるレスポンスで応答させる */
export const mockPdfStatusSequence = async (
  page: Page,
  id: string,
  statuses: PdfStatusBody[],
): Promise<void> => {
  let callCount = 0
  await page.route(`**/api/pdf/${id}/status`, async (route) => {
    const body = statuses[Math.min(callCount, statuses.length - 1)]
    callCount++
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

/** POST /api/pdf/:id/regenerate を成功として応答させる */
export const mockPdfRegenerate = async (page: Page, id: string): Promise<void> => {
  await page.route(`**/api/pdf/${id}/regenerate`, async (route) => {
    await route.fulfill({ status: 200 })
  })
}

/** GET /api/sheets/:id を成功/期限切れ/404のいずれかで応答させる */
export const mockSharedSheet = async (
  page: Page,
  scenario: SharedSheetScenario,
  payload?: { userName: string; expiryDays?: number },
): Promise<void> => {
  await page.route('**/api/sheets/*', async (route) => {
    if (scenario === 'success') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          userName: payload?.userName ?? 'mockUser',
          categories: [
            { categoryId: 1, questions: [{ questionId: 1, answers: [{ answerId: 1, value: 4 }] }] },
          ],
        }),
      })
      return
    }
    if (scenario === 'expired') {
      await route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ expiryDays: payload?.expiryDays ?? 5 }),
      })
      return
    }
    await route.fulfill({ status: 404 })
  })
}
