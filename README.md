# MAX Chat — тестовое задание GREEN-API

Простой веб-интерфейс для отправки и получения текстовых сообщений в мессенджере **MAX** через сервис [GREEN-API](https://green-api.com/max). Внешний вид — по мотивам [web.max.ru](https://web.max.ru/).

**Стек:** React 18 + Vite, без сторонних UI-библиотек и без бэкенда — все запросы идут из браузера напрямую в API GREEN-API.

## Как пользоваться

1. Откройте приложение и введите данные инстанса из [личного кабинета](https://console.green-api.com): `idInstance` и `apiTokenInstance`. Поле `apiUrl` можно не заполнять: по умолчанию берётся `https://{первые 4 цифры idInstance}.api.green-api.com`. Если в личном кабинете указан другой адрес, вставьте его.
2. Введите номер получателя (например, `79991234567`) и нажмите «Создать» — откроется новый чат.
3. Напишите сообщение и нажмите Enter (Shift+Enter — перенос строки).
4. Ответ получателя из MAX появится в чате автоматически.

> Инстанс должен быть авторизован (статус `authorized`). В его настройках должно быть включено получение уведомлений о входящих сообщениях (`incomingWebhook`), а поле `webhookUrl` — пустым, иначе HTTP API не отдаст уведомления.

## Локальный запуск

Нужен Node.js 18+.

```bash
git clone https://github.com/Basiton/green-api-max-chat.git
cd green-api-max-chat
npm install
npm run dev
```

Приложение откроется на http://localhost:5173.

Production-сборка: `npm run build`, результат — в папке `dist/` (статические файлы, открываются с любого хостинга).

## Как это устроено

| Задача | Метод GREEN-API |
|---|---|
| Проверка данных при входе | `GetStateInstance` — пускаем, только если инстанс `authorized` |
| Создание чата по номеру | `CheckAccount` — получаем `chatId` пользователя MAX по номеру телефона |
| Отправка сообщения | [`SendMessage`](https://green-api.com/v3/docs/api/sending/SendMessage/) |
| Получение сообщений | [HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/): цикл `ReceiveNotification` (`receiveTimeout=5`) → обработка → `DeleteNotification` |

- Цикл получения запросов идёт последовательно, без параллельных вызовов. Удаляется любое уведомление, в том числе служебное, иначе очередь встанет. При ошибке сети — пауза с нарастающей задержкой до 30 с.
- В чат попадают только текстовые сообщения (`textMessage`, `extendedTextMessage`): входящие и отправленные с телефона владельца инстанса.
- Данные инстанса и история чатов хранятся в `localStorage` браузера. Кнопка «Выйти» очищает данные входа.
- Зелёная точка у заголовка «Чаты» показывает, что получение сообщений работает, красная — что нет связи.
- Вёрстка адаптивная: на телефоне список чатов и переписка открываются по очереди.

## Структура

```
src/
  api/greenApi.js           — запросы к GREEN-API и разбор уведомлений
  hooks/useNotifications.js — цикл ReceiveNotification / DeleteNotification
  chatsReducer.js           — состояние чатов и сообщений
  components/               — LoginScreen, Sidebar, ChatView
```

## Деплой

В репозитории есть workflow GitHub Actions (`.github/workflows/deploy.yml`): при пуше в `main` он собирает проект и публикует его на GitHub Pages. В настройках репозитория нужно выбрать Settings → Pages → Source: **GitHub Actions**.
