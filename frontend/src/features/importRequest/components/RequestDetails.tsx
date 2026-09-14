import { Panel, PanelNote } from '../../../shared/ui/Panel'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { currentRole } from '../../../shared/session/authSession'
import page from '../../../shared/ui/PageHeading.module.css'
import type { SupplierResponseWire } from '../api/requestApi'
import { bidsTitle, type BidView, type RequestView } from '../logic/requestView'
import type { RequestActions } from '../useRequestActions'
import { BidList } from './BidList'
import { RequestRespondPanel } from './RequestRespondPanel'
import { RequestSpecsPanel } from './RequestSpecsPanel'
import styles from '../request.module.css'

interface RequestDetailsProps {
  view: RequestView
  bids: BidView[]
  mine: boolean
  myResponse: SupplierResponseWire | undefined
  actions: RequestActions
}

export function RequestDetails({ view, bids, mine, myResponse, actions }: RequestDetailsProps) {
  const { respond, close } = actions
  return (
    <>
      <h1 className={page.title}>{view.title}</h1>
      <p className={styles.subtitle}>
        {view.subtitle}
        <StatusBadge tone={view.active ? 'info' : 'past'}>
          {view.active ? 'активна' : 'закрыта'}
        </StatusBadge>
      </p>
      <RequestSpecsPanel
        view={view}
        mine={mine}
        closing={close.isPending}
        onClose={() => close.mutate()}
      />
      {/* Откликается только поставщик, и только на открытую заявку: закрытая
          откликов не принимает, и сервер отвечает на неё 409. */}
      {!mine && currentRole() === 'importer' && view.active ? (
        <RequestRespondPanel myResponse={myResponse} respond={respond} />
      ) : null}
      <BidsPanel bids={bids} />
    </>
  )
}

function BidsPanel({ bids }: { bids: BidView[] }) {
  return (
    <Panel title={bidsTitle(bids.length)} testId="request-bids">
      <BidList bids={bids} />
      <PanelNote>
        Отклик — это предложение наоборот: не вы торгуетесь за машину, а поставщики за вас. Площадка
        в расчётах не участвует.
      </PanelNote>
    </Panel>
  )
}
