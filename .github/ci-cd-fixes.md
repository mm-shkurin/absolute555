# Второй разбор CI/CD и переход на Kubernetes

Продолжение `.github/ci-cd-audit.md`: то, что осталось после первого разбора, и план
переезда стека в Kubernetes. Порядок работы: правка + отметка в таблице = один коммит.

- ✅ — сделано в репозитории.
- 📝 — кодом не закрыть (сервер, настройки GitHub); инструкция в `infra/production-setup.md`.
- ❌ — не сделано.

## Образы и сборка

| # | Проблема | Решение | Готово |
|---|---|---|---|
| B1 | В CI Postgres 16, в compose и на проде 17 — миграции проверяются не на той версии | `postgres:17-alpine` в `backend.yml` и `scripts/ci-local.sh` | ✅ |
| B2 | Образ фронтенда собирается на Node 22, CI — на Node 24 | Одна версия Node в Dockerfile и во всех прогонах | ✅ |
| B3 | Миграции запускаются дважды: в `CMD` образа и в `deploy.sh`; при двух репликах — гонка. Откат на версию до миграции падал: старый `alembic upgrade head` не знает новую ревизию | Разовый сервис `migrate` в compose, `backend` ждёт его завершения; `rollback.sh` поднимает приложение с `--no-deps`, без миграций | ✅ |
| B4 | Образ бэкенда в одну стадию: `gcc` и `-dev` пакеты в рантайме, процесс от root | Multi-stage с venv, рантайм без компилятора, uid 10001; образ 1.86 → 1.2 ГБ | ✅ |
| B5 | Образы не сканируются на уязвимости, состав не записан. Первый скан нашёл CRITICAL в `anyio 3.7.1`, который pip-audit пропускал, и десятки исправленных CVE в базовых слоях | trivy 0.74.0 по sha-образу в `images` (исправимые `HIGH`/`CRITICAL`), SBOM артефактом; `anyio` 4.14.2; `pull: true` и обновление пакетов ОС в рантайм-слоях | ✅ |
| B6 | Образ собирается трижды: в `backend`/`frontend`, в `stack` через `--build`, в `release`; в прод уходит не та сборка, что прошла e2e | Прогон `images`: один раз на коммит, в GHCR по sha; `stack` тянет его, `release` только ставит `latest` | ✅ |
| B7 | В `requirements.txt` 80 пакетов, которых код не импортирует: gigachat, opentelemetry, kubernetes, posthog, minio, amqp, GeoAlchemy2 и их зависимости — лишний вес образа и лишние CVE. `pillow`, `pytesseract`, `opencv` без версий | Оставлено замыкание по импортам `app`/`alembic`/`tests`: 129 → 50 строк, всё с пинами; образ 1.27 → 0.96 ГБ | ✅ |

## Документация

| # | Проблема | Решение | Готово |
|---|---|---|---|
| D1 | `infra/architecture.md` описывает старый стек: 4 сервиса, нет worker и MinIO, открытые порты Postgres, CRA-пути | Переписать по текущему `docker-compose.yml` | ✅ |
| D2 | `technology.md` и `CLAUDE.md` говорят React 19, CRA, Jest, Sass, axios; по факту React 18, TypeScript, Vite, vitest, TanStack Query, обычный CSS | `technology.md` переписан по `package.json` и импортам бэкенда, `CLAUDE.md` и комментарии nginx/Dockerfile приведены к факту | ✅ |

## Хвосты первого разбора

| # | Проблема | Где закрывается | Готово |
|---|---|---|---|
| S2 | Ключ развёртывания даёт полный shell | `infra/production-setup.md`, раздел 2 | 📝 |
| G5 | `main` не защищена | `infra/production-setup.md`, раздел 3 | 📝 |
| R5 | Нет внешней пробы `/health` | `infra/production-setup.md`, раздел 6 | 📝 |
| R3 | Нет staging | K8: namespace `staging` | ❌ |
| R4 | Простой при развёртывании | K4: rolling update | ❌ |

## Kubernetes

Следующий этап, после разделов выше. Манифесты — kustomize в `infra/k8s/`, локальный
кластер — Kubernetes в Docker Desktop.

| # | Шаг | Что получаем | Готово |
|---|---|---|---|
| K1 | `infra/k8s/base`: Postgres, Redis, MinIO как StatefulSet + PVC, конфиг в ConfigMap/Secret | Хранилища в кластере | ❌ |
| K2 | `minio-init` и миграции как Job | Разовые задачи вне приложения | ❌ |
| K3 | backend, worker, frontend как Deployment + Service, пробы на `/health` | Приложение в кластере | ❌ |
| K4 | Две реплики backend, RollingUpdate, `kubectl rollout undo` | Развёртывание без простоя (R4) | ❌ |
| K5 | Ingress с настройками WebSocket и SSE | Один вход снаружи | ❌ |
| K6 | Оверлеи `dev` / `staging` / `prod` | Staging теми же манифестами (R3) | ❌ |
| K7 | `kubeconform` в `rules` | Манифесты проверяются на каждый пуш | ❌ |
| K8 | Прогон в kind в CI рядом со `stack` | Стек в кластере проверяется так же, как в compose | ❌ |
| K9 | Лог только в stdout, без файла `logs/app.log` в контейнере | `readOnlyRootFilesystem`, логи собирает кластер | ❌ |
