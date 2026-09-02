// Форма заявки «хочу такую». Обратный аукцион начинается здесь: покупатель описывает
// машину, которой в ленте нет, и поставщики отвечают ценой под ключ.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { FormCard, NarrowPage, NavSpacer } from '../../shared/ui/FormCard'
import { Form, Field, Select, TextArea, TextInput } from '../../shared/ui/Form'
import { Button } from '../../shared/ui/Button'
import { PanelNote } from '../../shared/ui/Panel'
import { ROUTES } from '../../shared/navigation/routes'
import { COUNTRIES, WAIT_OPTIONS, emptyRequestDraft, missingForRequest } from './logic/requestDraft'
import styles from './request.module.css'

export function NewRequestPage({ signedIn = true }: { signedIn?: boolean }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(emptyRequestDraft)
  const set = (key: keyof typeof draft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }))
  const gaps = missingForRequest(draft)

  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main data-testid="new-import-request">
        <Container>
          <NarrowPage>
            <div className={styles.crumbs}>
              <Link to={ROUTES.importFeed}>Под заказ</Link> › Новая заявка
            </div>
            <PageSection>
              <FormCard
                title="Опишите, что нужно привезти"
                sub="Заявку увидят одобренные поставщики и ответят ценой под ключ и сроком. Это не покупка — вы ничего не платите и ни к чему не обязаны."
                testId="request-form"
                nav={
                  <>
                    <Button tone="ghost" onClick={() => navigate(ROUTES.importFeed)}>
                      Отмена
                    </Button>
                    <NavSpacer />
                    <Button
                      disabled={gaps.length > 0}
                      onClick={() => navigate(ROUTES.importFeed)}
                      data-testid="publish-request"
                    >
                      Опубликовать заявку
                    </Button>
                  </>
                }
              >
                <Form>
                  <Field label="Марка">
                    <TextInput
                      value={draft.brand}
                      onChange={(value) => set('brand', value)}
                      placeholder="Toyota"
                    />
                  </Field>
                  <Field label="Модель">
                    <TextInput
                      value={draft.model}
                      onChange={(value) => set('model', value)}
                      placeholder="Land Cruiser 300"
                    />
                  </Field>
                  <Field label="Год — от">
                    <TextInput
                      value={draft.yearFrom}
                      onChange={(value) => set('yearFrom', value)}
                      placeholder="2022"
                    />
                  </Field>
                  <Field label="Год — до">
                    <TextInput
                      value={draft.yearTo}
                      onChange={(value) => set('yearTo', value)}
                      placeholder="2023"
                    />
                  </Field>
                  <Field label="Бюджет под ключ, ₽">
                    <TextInput
                      value={draft.budget}
                      onChange={(value) => set('budget', value)}
                      placeholder="12 000 000"
                    />
                  </Field>
                  <Field label="Пробег, км — не больше">
                    <TextInput
                      value={draft.mileage}
                      onChange={(value) => set('mileage', value)}
                      placeholder="60 000"
                    />
                  </Field>
                  <Field label="Откуда везти">
                    <Select
                      value={draft.country}
                      onChange={(value) => set('country', value)}
                      options={COUNTRIES}
                    />
                  </Field>
                  <Field label="Готов ждать">
                    <Select
                      value={draft.wait}
                      onChange={(value) => set('wait', value)}
                      options={WAIT_OPTIONS}
                    />
                  </Field>
                  <Field label="Что важно" full>
                    <TextArea
                      value={draft.comment}
                      onChange={(value) => set('comment', value)}
                      placeholder="Комплектация, цвет салона, требования к документам."
                    />
                  </Field>
                </Form>
                <div className={styles.note}>
                  <PanelNote>
                    Заявка живёт 30 дней, потом закроется сама. Отклики приходят в профиль и в чат.
                  </PanelNote>
                </div>
                {gaps.length > 0 ? (
                  <p className={styles.gaps}>Чтобы опубликовать, не хватает: {gaps.join(', ')}.</p>
                ) : null}
              </FormCard>
            </PageSection>
          </NarrowPage>
        </Container>
      </main>
    </>
  )
}
