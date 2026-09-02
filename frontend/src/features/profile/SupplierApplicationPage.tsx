// Заявка на роль поставщика. Одобряет человек, а не проверка документов, — и текст об этом
// говорит прямо: обещание проверки, которой нет, стоит дороже, чем её отсутствие.
//
// В заявке два поля, а не анкета: сервер принимает «зачем» и свободный текст. Условия
// поставки — страны, марки, сроки, предоплата — принадлежат профилю поставщика, который
// заполняют после одобрения (история 16). Спрашивать их здесь значило бы собирать то,
// чего никто не сохранит.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { FormCard, NarrowPage, NavSpacer } from '../../shared/ui/FormCard'
import { Form, Field, TextArea } from '../../shared/ui/Form'
import { Button } from '../../shared/ui/Button'
import { PanelNote } from '../../shared/ui/Panel'
import { ROUTES } from '../../shared/navigation/routes'
import { emptyRoleRequestDraft, missingForRoleRequest } from './logic/roleRequestDraft'
import { useRoleRequest } from './useRoleRequest'
import styles from './profile.module.css'

export function SupplierApplicationPage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(emptyRoleRequestDraft)
  const request = useRoleRequest()
  const gaps = missingForRoleRequest(draft)
  const pending = request.mine.find(
    (one) => one.requested_role === 'importer' && one.status === 'pending',
  )

  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="supplier-application-form">
        <Container>
          <NarrowPage>
            <div className={styles.crumbs}>
              <Link to={ROUTES.profile}>Профиль</Link> › Стать поставщиком
            </div>
            <PageSection>
              <FormCard
                title="Заявка на роль поставщика"
                sub="Заявку рассматривает модератор. Одобрят — сможете завести профиль поставщика и публиковать позиции под привоз."
                testId="supplier-form"
                nav={
                  <>
                    <Button tone="ghost" onClick={() => navigate(ROUTES.profile)}>
                      Отмена
                    </Button>
                    <NavSpacer />
                    <Button
                      disabled={
                        request.sending || request.sent || pending !== undefined || gaps.length > 0
                      }
                      onClick={() => request.send(draft)}
                      data-testid="submit-application"
                    >
                      Отправить заявку
                    </Button>
                  </>
                }
              >
                {request.sent || pending ? (
                  <p className={styles.gaps} data-testid="request-pending">
                    Заявка отправлена и ждёт решения. Вторую подать нельзя — модератор
                    ответит по этой.
                  </p>
                ) : (
                  <Form>
                    <Field label="Зачем вам эта роль" full>
                      <TextArea
                        value={draft.reason}
                        onChange={(value) => setDraft({ ...draft, reason: value })}
                        placeholder="Вожу машины из Японии и Кореи, хочу выставлять позиции сам."
                      />
                    </Field>
                    <Field label="Об опыте: сколько возите, через кого работаете" full>
                      <TextArea
                        value={draft.about}
                        onChange={(value) => setDraft({ ...draft, about: value })}
                        placeholder="Что можете показать по прошлым поставкам — модератор судит по этому тексту."
                      />
                    </Field>
                  </Form>
                )}
                <div className={styles.note}>
                  <PanelNote>
                    Площадка не проверяет ваши документы и не даёт гарантий покупателям от вашего
                    имени. Одобрение означает только то, что модератор посчитал заявку
                    правдоподобной.
                  </PanelNote>
                </div>
                {request.failure ? (
                  <p className={styles.gaps} data-testid="request-failure">
                    {request.failure}
                  </p>
                ) : null}
                {gaps.length > 0 && !pending && !request.sent ? (
                  <p className={styles.gaps}>Чтобы отправить, не хватает: {gaps.join(', ')}.</p>
                ) : null}
              </FormCard>
            </PageSection>
          </NarrowPage>
        </Container>
      </main>
    </>
  )
}
