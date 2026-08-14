import { test as base } from '@playwright/test'

import { ResultPage } from './pages/ResultPage'
import { SurveyPage } from './pages/SurveyPage'
import { TopPage } from './pages/TopPage'

type Pages = {
  topPage: TopPage
  surveyPage: SurveyPage
  resultPage: ResultPage
}

export const test = base.extend<Pages>({
  topPage: async ({ page }, use) => {
    await use(new TopPage(page))
  },
  surveyPage: async ({ page }, use) => {
    await use(new SurveyPage(page))
  },
  resultPage: async ({ page }, use) => {
    await use(new ResultPage(page))
  },
})

export { expect } from '@playwright/test'
