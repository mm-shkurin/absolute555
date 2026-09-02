// Форма заявки «хочу такую». Обратный аукцион начинается здесь: покупатель описывает
// машину, которой в ленте нет, и поставщики отвечают ценой под ключ.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { FormCard, NarrowPage, NavSpacer } from '../../shared/ui/FormCard'
import { Form, Field, TextArea, TextInput } from '../../shared/ui/Form'
import { Button } from '../../shared/ui/Button'
import { PanelNote } from '../../shared/ui/Panel'
import { ROUTES } from '../../shared/navigation/routes'
import { openRequest } from './api/requestApi'
import { CatalogPickers } from './components/CatalogPickers'
import { emptyRequestDraft, missingForRequest, toRequestBody } from './logic/requestDraft'
import { requestFailureText } from './logic/requestFailure'
import styles from './request.module.css'

export function NewRequestPage({ signedIn = true }: { signedIn?: boolean }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(emptyRequestDraft)
  const set = (key: keyof typeof draft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }))
  const gaps = missingForRequest(draft)

  const open = useMutation({
    mutationFn: () => openRequest(toRequestBody(draft)),
    onSuccess: (request) => navigate(ROUTES.importRequest(request.request_id)),
  })

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
                      disabled={gaps.length > 0 || open.isPending}
                      onClick={() => open.mutate()}
                      data-testid="publish-request"
                    >
                      Опубликовать заявку
                    </Button>
                  </>
                }
              >
                <Form>
                  <CatalogPickers
                    draft={draft}
                    onPickBrand={(id, name) =>
                      setDraft((current) => ({
                        ...current,
                        brandId: id,
                        brandName: name,
                        // Смена марки обнуляет модель: модель от другой марки уехала бы
                        // в заявку молча.
                        modelId: '',
                        modelName: '',
                      }))
                    }
                    onPickModel={(id, name) =>
                      setDraft((current) => ({ ...current, modelId: id, modelName: name }))
                    }
                  />
                  <Field label="Год — от">
                    <TextInput
                      value={draft.yearFrom}
                      onChange={(value) => set('yearFrom', value)}
                      placeholder="2022"
                    />
                  </Field>
                  <Field label="Бюджет под ключ, ₽">
                    <TextInput
                      value={draft.budget}
                      onChange={(value) => set('budget', value)}
                      placeholder="12 000 000"
                      testId="request-budget"
                    />
                  </Field>
                  <Field label="Что важно" full>
                    <TextArea
                      value={draft.comment}
                      onChange={(value) => set('comment', value)}
                      placeholder="Комплектация, цвет, что не подходит совсем."
                    />
                  </Field>
                </Form>
                {gaps.length > 0 ? (
                  <p className={styles.gaps}>Не хватает: {gaps.join(', ')}.</p>
                ) : null}
                {open.error ? (
                  <p className={styles.refused} role="alert" data-testid="request-error">
                    {requestFailureText(open.error)}
                  </p>
                ) : null}
                <PanelNote>
                  Открытых заявок может быть не больше трёх. Закрытая заявка откликов не
                  принимает — поставщики видят только открытые.
                </PanelNote>
              </FormCard>
            </PageSection>
          </NarrowPage>
        </Container>
      </main>
    </>
  )
}
