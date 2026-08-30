// Анкета на роль поставщика. Одобряет человек, а не проверка документов, — и текст об этом
// говорит прямо: обещание проверки, которой нет, стоит дороже, чем её отсутствие.
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
import { CONTACT_MODES, emptySupplierDraft, missingForSupplier } from './logic/supplierDraft'
import styles from './profile.module.css'

export function SupplierApplicationPage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(emptySupplierDraft)
  const set = (key: keyof typeof draft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }))
  const gaps = missingForSupplier(draft)

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
                sub="Заявку рассматривает владелец площадки. Одобрят — получите публичную страницу и сможете публиковать позиции под привоз сами, без ручного участия."
                testId="supplier-form"
                nav={
                  <>
                    <Button tone="ghost" onClick={() => navigate(ROUTES.profile)}>
                      Отмена
                    </Button>
                    <NavSpacer />
                    <Button
                      disabled={gaps.length > 0}
                      onClick={() => navigate(ROUTES.profile)}
                      data-testid="submit-application"
                    >
                      Отправить заявку
                    </Button>
                  </>
                }
              >
                <Form>
                  <Field label="Название или как вас представлять" full>
                    <TextInput
                      value={draft.name}
                      onChange={(value) => set('name', value)}
                      placeholder="Восток-Авто"
                    />
                  </Field>
                  <Field label="Страны">
                    <TextInput
                      value={draft.countries}
                      onChange={(value) => set('countries', value)}
                      placeholder="Япония, Корея"
                    />
                  </Field>
                  <Field label="Марки">
                    <TextInput
                      value={draft.brands}
                      onChange={(value) => set('brands', value)}
                      placeholder="Toyota, Lexus, Honda"
                    />
                  </Field>
                  <Field label="Срок доставки">
                    <TextInput
                      value={draft.deliveryDays}
                      onChange={(value) => set('deliveryDays', value)}
                      placeholder="45–70 дней"
                    />
                  </Field>
                  <Field label="Предоплата">
                    <TextInput
                      value={draft.prepayment}
                      onChange={(value) => set('prepayment', value)}
                      placeholder="30% при заказе"
                    />
                  </Field>
                  <Field label="Телефон">
                    <TextInput
                      value={draft.phone}
                      onChange={(value) => set('phone', value)}
                      placeholder="+7 913 000-00-00"
                      mono
                    />
                  </Field>
                  <Field label="Способ связи">
                    <Select
                      value={draft.contactMode}
                      onChange={(value) => set('contactMode', value)}
                      options={CONTACT_MODES}
                    />
                  </Field>
                  <Field label="О себе и об опыте" full>
                    <TextArea
                      value={draft.about}
                      onChange={(value) => set('about', value)}
                      placeholder="Сколько лет возите, через кого работаете, что можете показать по прошлым поставкам."
                    />
                  </Field>
                </Form>
                <div className={styles.note}>
                  <PanelNote>
                    Площадка не проверяет ваши документы и не даёт гарантий покупателям от вашего
                    имени. Одобрение означает только то, что владелец посчитал заявку
                    правдоподобной.
                  </PanelNote>
                </div>
                {gaps.length > 0 ? (
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
